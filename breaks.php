<?php
defined( 'ABSPATH' ) or die( 'Access denied' );
require(__DIR__ . '/vendor/autoload.php');
/*
Plugin Name: Break Tracker
Description: Plugin for tracking and submitting breaks for a call center technical support team.
Version: 2.0
Author: Jadon Naas
*/

class BreakRestController extends WP_REST_Controller{
    
    public function register_routes(){
        $version = '1';
        $namespace = '/breaks/v' . $version;
        $base = 'route';
        register_rest_route( $namespace, '/' . $base, array(
            array(
                'methods' => 'GET',
                'callback' => array( $this, 'get_items' ),
                'permission_callback' => array( $this, 'get_items_permissions_check'),
                'args' => array(),
            ),
            array(
                'methods' => 'POST',
                'callback'=> array( $this, 'create_item' ),
                'permission_callback' => array( $this, 'create_item_permissions_check' ),
                'args' => $this->get_endpoint_args_for_item_schema( true ),
                ),
            )
        );
        register_rest_route( $namespace, '/' . $base . '/admin', array(
            array(
                'methods' => 'POST',
                'callback' => array( $this, 'update_item' ),
                'permission_callback' => array( $this, 'update_item_permissions_check'),
                'args' => $this->get_endpoint_args_for_item_schema( false ),
            ),
        ));
    }
    public function get_items( $request ){
        $items = $this->get_active_breaks_from_db();
        $responseData = array('data' => []);
        foreach( $items as $item ){
            $itemdata = $this->prepare_item_for_response( $item, $request );
            array_push($responseData['data'], $itemdata);
        }
        $response = new WP_REST_Response( $responseData, 200);
        $response->header('Cache-Control', 'no-cache, no-store, must-revalidate', true);
        return $response;
    }

    public function create_item( $request ){
        global $wpdb;
        $submission = json_decode($request->get_body());
        $submissionDay = current_time('Y-m-d');
        $submissionTime = current_time('H:i:s');
        $newStatus = 'queued';
        $userSubmission = $submission->user;
        $userPod = $submission->pod;
        $userPosture = $submission->posture;
        $userNextPunchout = $submission->next_punchout;
        $breakID = md5($submissionTime . $userSubmission . $userPosture . $userPod . $userNextPunchout);

        $insertResult = $wpdb->insert(
            $wpdb->prefix . 'breaks',
            array(
                'day' => $submissionDay,
                'time_submitted' => $submissionTime,
                'time_updated' => $submissionTime,
                'user' => $userSubmission,
                'pod' => $userPod,
                'posture' => $userPosture,
                'next_punchout' => $userNextPunchout,
                'status' => $newStatus,
                'break_id' => $breakID,
            ),
            array(
                '%s',
                '%s',
                '%s',
                '%s',
                '%s',
                '%s',
                '%s',
                '%s',
                '%s',
            )
        );
        if($insertResult == 1){
            $responseData = array('success' => true, 'result' => 'Break saved.');
        }else{
            $responseData = array('success' => false, 'result' => 'Break request failed. Break could not be saved to database..');
        }
        $response = new WP_REST_Response( $responseData, 200);
        $response->header('Cache-Control', 'no-cache, no-store, must-revalidate', true);
        return $response;

    }

    public function get_items_permissions_check( $request ){
        return True;
    }

    public function create_item_permissions_check ( $request ){
        return True;
    }

    public function update_item_permissions_check( $request ){
        return current_user_can( 'manage_options' );
    }

    public function prepare_item_for_response( $item, $request){
        return $item;
    }

    public function update_item( $request ){
        global $wpdb;
        $body = $request->get_body();
        $decodedBody = json_decode($body);
        $results = array();
        $wpdb->show_errors();
        foreach($decodedBody->changes as $breakID => $newStatus){
            if($newStatus == 'cancelled' || $newStatus == 'returned'){
                $closeTime = current_time('H:i:s');
                $result = $wpdb->update($wpdb->prefix . 'breaks',
                              array('time_closed' => $closeTime,
                                    'status' => $newStatus,
                                    'active' => 0),
                              array('break_id' => $breakID),
                              array('%s', '%s', '%d'),
                              array('%s')
                );
                array_push($results, $result);
            } else{
                $updateTime = current_time('H:i:s');
                $result = $wpdb->update($wpdb->prefix . 'breaks',
                                array('time_updated' => $updateTime,
                                      'status' => $newStatus),
                                array('break_id' => $breakID),
                                array('%s', '%s'),
                                array('%s')
                );
                array_push($results, $result);
            }
        }
        $responseData = array('data' => $results);
        $response = new WP_REST_Response( $responseData, 200);
        $response->header('Cache-Control', 'no-cache, no-store, must-revalidate', true);
        return $response;
    }

    public function get_active_breaks_from_db(){
        global $wpdb;
        $breakCount = 0;
        $breakAdminSQL = "SELECT * FROM " . $wpdb->prefix . "breaks WHERE active != 0 ORDER BY time_submitted ASC";
        $activeBreaks = $wpdb->get_results($breakAdminSQL, 'ARRAY_A');
        return $activeBreaks;
    }   
}

$breaks = new BreakRestController();

add_action( 'rest_api_init', [$breaks, 'register_routes']);

add_action( 'admin_menu', 'breaks_menu' );
function breaks_menu(){
    add_menu_page( 'Break Management', 'Breaks', 'manage_options', 'breaks/breaks.php', 'breaks_admin', 'dashicons-clock', '4.105');
}

function breaks_admin(){
    if(!current_user_can('manage_options')){
        wp_die(__('You do not have sufficient permissions to access this page.'));
    }
    wp_register_script( 'breaks-admin-view', plugins_url( '/js/breaks-admin-view.js', __FILE__));
    wp_localize_script( 'breaks-admin-view', 'wpApiSettings', array(
        'root' => esc_url_raw( rest_url() ),
        'nonce' => wp_create_nonce( 'wp_rest' ),
        'posture_colors' => breaks_fetch_posture_colors()
    ));
    ob_start();
    wp_enqueue_style('bootstrap', plugins_url('/public/bootstrap.min.css', __FILE__));
    wp_enqueue_style('breaks', plugins_url('/css/breaks.css', __FILE__));
    wp_enqueue_script('boostrap-js', plugins_url('/public/bootstrap.min.js', __FILE__));
    wp_enqueue_script('react', plugins_url('/public/react.min.js', __FILE__));
    wp_enqueue_script('react-dom', plugins_url('/public/react-dom.min.js', __FILE__));
    wp_enqueue_script('breaks-admin-view', plugins_url('/js/breaks-admin-view.js', __FILE__));
    echo ob_get_clean();
}

//[breaks_form]
function breaks_form_shortcode(){
    wp_register_script( 'breaks-form-view', plugins_url( '/js/breaks-form-view.js', __FILE__ ));
    wp_localize_script( 'breaks-form-view', 'breaksFormOptions', array(
        'root' => esc_url_raw( rest_url() ),
        'postures' => fetch_postures(),
        'pods' => fetch_pods(),
    ));
    ob_start();
    wp_enqueue_style('bootstrap', plugins_url('/public/bootstrap.min.css', __FILE__));
    wp_enqueue_style('breaks', plugins_url('/css/breaks.css', __FILE__));
    wp_enqueue_script('boostrap-js', plugins_url('/public/bootstrap.min.js', __FILE__));
    wp_enqueue_script('react', plugins_url('/public/react.min.js', __FILE__));
    wp_enqueue_script('react-dom', plugins_url('/public/react-dom.min.js', __FILE__));
    wp_enqueue_script('breaks-form-view', plugins_url('/js/breaks-form-view.js', __FILE__));
    return ob_get_clean();
}
add_shortcode('breaks_form', 'breaks_form_shortcode');

function fetch_postures(){
    return get_option('postures');
}

function breaks_fetch_posture_colors(){

    $colors = get_option('posture_colors');
    return $colors;
}

function breaks_list_shortcode(){
    wp_register_script( 'breaks-list-view', plugins_url( '/js/breaks-list-view.js', __FILE__ ));
    wp_localize_script( 'breaks-list-view', 'breaksOptions', array(
        'root' => esc_url_raw( rest_url() ),
        'posture_colors' => breaks_fetch_posture_colors(),
    ));
    ob_start();
    wp_enqueue_style('bootstrap', plugins_url('/public/bootstrap.min.css', __FILE__));
    wp_enqueue_style('breaks', plugins_url('/css/breaks.css', __FILE__));
    wp_enqueue_script('boostrap-js', plugins_url('/public/bootstrap.min.js', __FILE__));
    wp_enqueue_script('react', plugins_url('/public/react.min.js', __FILE__));
    wp_enqueue_script('react-dom', plugins_url('/public/react-dom.min.js', __FILE__));
    wp_enqueue_script('breaks-list-view', plugins_url('/js/breaks-list-view.js', __FILE__));
    return ob_get_clean();
}

add_shortcode('breaks_list', 'breaks_list_shortcode');

global $breaks_db_version;
$breaks_db_version = '0.3';

function breaks_install(){

    setup_breaks_database();
}

function setup_breaks_database(){
    global $wpdb;
    global $breaks_db_version;

    $tables_exist = get_option('breaks_db_version', false);
    if($tables_exist === false){
        $breaks_table_name = $wpdb->prefix . "breaks";
        $charset_collate = $wpdb->get_charset_collate();
        $sql_breaks = "CREATE TABLE $breaks_table_name(
            id mediumint(18) NOT NULL AUTO_INCREMENT,
            day date NOT NULL,
            time_submitted time NOT NULL,
            time_updated time DEFAULT '00:00:00' NOT NULL,
            time_closed time DEFAULT '00:00:00' NOT NULL,
            user tinytext NOT NULL,
            posture tinytext NOT NULL,
            pod tinytext NOT NULL,
            status tinytext NOT NULL,
            next_punchout tinytext NOT NULL,
            active tinyint DEFAULT 1 NOT NULL,
            break_id text NOT NULL,
            UNIQUE KEY id (id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_breaks);

        update_option('breaks_db_version', $breaks_db_version);
    }
}

register_activation_hook(__FILE__, 'breaks_install');

add_action('admin_menu', 'breaks_menu_posture_settings_submenu');

function breaks_menu_posture_settings_submenu(){
    add_submenu_page('breaks/breaks.php', 'Breaks Posture Settings', 'Postures', 'manage_options', 'breaks_admin_posture_settings', 'breaks_posture_settings');
}

function breaks_posture_settings(){
    ob_start();
    wp_enqueue_style('breaks', plugins_url('css/breaks.css', __FILE__));
    breaks_posture_settings_submit();
    breaks_posture_settings_code();
    echo ob_get_clean();
}

function breaks_posture_settings_code(){
    
    echo
    '
    <h1>Break Manager Posture Settings</h1>
    <p>This page contains settings for the colors and postures in use 
       on the break list.</p>
    ';
    breaks_posture_settings_html();

}

function breaks_posture_settings_submit(){
    
    $postures = get_option('postures', []);
    $posture_colors = get_option('posture_colors', []);
    if(isset($_POST['breaks-new-posture-submitted'])){
        $newPosture = $_POST['new_posture'];
        $postures[] = $newPosture;
        update_option('postures', $postures);
    }
    if(isset($_POST['breaks-delete-posture-submitted'])){
        $deletedPosture = $_POST['deleted_posture'];
        $postureKey = array_search($deletedPosture, $postures);
        unset($postures[$postureKey]);
        $posture_colors[$deletedPosture] = '#ffffff';
        update_option('postures', $postures);
        update_option('posture_colors', $posture_colors);
    }
    if(isset($_POST['breaks-add-color-submitted'])){
        $newColor = $_POST['new_color'];
        $selectedPosture = $_POST['selected_posture'];
        $posture_colors[$selectedPosture] = $newColor;
        update_option('posture_colors', $posture_colors);
    }
}

function breaks_posture_settings_html(){
    $postures = get_option('postures', []);
    $posture_colors = get_option('posture_colors', []);
    echo 
    '
    <div class="posture-settings">
    <h2>Add Posture</h2>
    <form class="breaks-form" action="' . esc_url( $_SERVER['REQUEST_URI'] ) . '"method="post">
    <input type="text" name="new_posture" value="">
    <input type="submit" name="breaks-new-posture-submitted" value="Submit">
    </form>
    ';
    if(count($postures) !== 0){
        echo
        '
        <h2>Delete Posture</h2>
        <form class="breaks-form" action="' . esc_url( $_SERVER['REQUEST_URI'] ) . '"method="post">
        <select name="deleted_posture">
        ';
        foreach($postures as $posture){
            echo '<option value="' . $posture . '">' . $posture . '</option>';
        }
        echo
        '
        </select>
        <input type="submit" name="breaks-delete-posture-submitted" value="Submit">
        </form>
        ';

        echo
        '
        <h2>Add Color</h2>
        <form class="breaks-form" action="' . esc_url( $_SERVER['REQUEST_URI'] ) . '"method="post">
        <input type="text" name="new_color" value="">
        <select name="selected_posture">
        ';
        foreach($postures as $posture){
            echo '<option value="' . $posture . '">' . $posture . '</option>';
        }
        echo
        '
        </select>
        <input type="submit" name="breaks-add-color-submitted" value="Submit">
        </form>
        ';

    }
    else{
        echo '<p>There are currently no postures setup.</p>';
    }
    echo '</div>';
}
