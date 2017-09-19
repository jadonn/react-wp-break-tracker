class BreaksAdminView extends React.Component{
    constructor(props){
        super(props);
        this.state = {changes: {}};
        this.breaks = [];
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.fetchBreaks(this);
        console.log(wpApiSettings.posture_colors);
        this.breakElements = [];
    }
    render(){
        this.breakElements = this.breaks.map(function(breakData){
            return React.createElement(Break, {data: breakData, onChange: this.handleStatusChange}, null);
        }, this);
        var heading = React.createElement('h1', {}, `Breaks Admin Page`);
        var rowHeading = this.createHeading();
        var breakList = React.createElement('ul', {className: 'list-group'}, [rowHeading, this.breakElements]);
        var submit = React.createElement('button', {className: 'btn btn-default pull-right', onClick: this.handleSubmit}, `Submit`);
        var mainContainer = React.createElement('div', {className: 'container'}, [heading, breakList, submit]);
        return mainContainer;
    }

    handleStatusChange(newStatus, breakID){
        this.setState((prevState, props)=>{
            if(newStatus === ''){
                delete prevState.changes[breakID];
                return {changes: prevState.changes};
            }else{
                prevState.changes[breakID] = newStatus;
                return {changes: prevState.changes};
            }
        }, function(){
            console.log(this.state.changes);
        });
    }

    handleSubmit(){
        var self = this;
        var breakSubmission = new XMLHttpRequest();
        breakSubmission.open("POST", "/wp-json/breaks/v1/route/admin");
        breakSubmission.setRequestHeader('X-WP-Nonce', wpApiSettings.nonce);
        breakSubmission.addEventListener('load', function(){
            self.setState((prevState, props) =>{
                return {changes: []};
            }, function(){
                console.log(self.state);
            })
            window.location.reload();
        });
        breakSubmission.send(JSON.stringify(this.state));

    }

    fetchBreaks(self){
        var breakData = new XMLHttpRequest();
        breakData.open("GET", "/wp-json/breaks/v1/route");
        breakData.setRequestHeader('Cache-control', 'no-cache no-store must-revalidate');
        breakData.setRequestHeader('Pragma', 'no-cache');
        breakData.addEventListener('load', function(response){
            var parsedResponse = JSON.parse(this.response);
            var data = parsedResponse.data;
            self.breaks = data;
            self.forceUpdate();
            setTimeout(self.fetchBreaks, 60000, self);
        });
        breakData.send();
        
    }

    createHeading(){
        var userText = React.createElement('strong', {}, `User`);
        var userHeading = React.createElement('div', {className: 'col-md-1 text-center col-sm-1'}, userText);
        var timeSubmittedText = React.createElement('strong', {}, `Time Submitted`);
        var timeSubmittedHeading = React.createElement('div', {className: 'col-md-2 text-center col-sm-1'}, timeSubmittedText);
        var timeUpdatedText = React.createElement('strong', {}, `Time Updated`);
        var timeUpdatedHeading = React.createElement('div', {className: 'col-md-2 text-center col-sm-2'}, timeUpdatedText);
        var nextPunchoutText = React.createElement('strong', {}, `Next Punchout`);
        var nextPunchoutHeading = React.createElement('div', {className: 'col-md-2 text-center col-sm-2'}, nextPunchoutText);
        var statusText = React.createElement('strong', {}, `Status`);
        var statusHeading = React.createElement('div', {className: 'col-md-1 text-center col-sm-1'}, statusText);
        var postureText = React.createElement('strong', {}, `Posture`);
        var postureHeading = React.createElement('div', {className: 'col-md-1 text-center col-sm-1'}, postureText);
        var updateText = React.createElement('strong', {}, `Update`);
        var updateHeading = React.createElement('div', {className: 'col-md-2 text-center'}, updateText);
        var breakHeadingRow = React.createElement('div', {className: 'row'}, [userHeading, timeSubmittedHeading, timeUpdatedHeading, nextPunchoutHeading, statusHeading, postureHeading, updateHeading]);
        return React.createElement('li', {className: 'list-group-item'}, breakHeadingRow);
    }
}

class Break extends React.Component{
    constructor(props){
        super(props);
        this.state = {change: ''};
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event){
        this.setState({change: event.target.value});
        if(event.target.value === ''){
            this.props.onChange('', this.props.data.break_id)
        }else{
            this.props.onChange(event.target.value, this.props.data.break_id);
        }
    }

    render(){
        var user = React.createElement('div', {className: 'col-md-1 text-center col-sm-1'}, this.props.data.user);
        var timeSubmitted = React.createElement('div', {className: 'col-md-2 text-center col-sm-1'}, this.props.data.time_submitted);
        var timeUpdated = React.createElement('div', {className: 'col-md-2 text-center col-sm-2'}, this.props.data.time_updated);
        var nextPunchout = React.createElement('div', {className: 'col-md-2 text-center col-sm-2'}, this.props.data.next_punchout);
        var status = React.createElement('div', {className: 'col-md-1 text-center col-sm-1 '.concat(this.props.data.status)}, this.props.data.status);
        var posture = React.createElement('div', {className: 'col-md-1 text-center col-sm-1 '.concat(this.props.data.posture), style: {backgroundColor: wpApiSettings.posture_colors[this.props.data.posture]}}, this.props.data.posture);
        var statusOptions = this.createStatusOptions();
        var selectStatus = React.createElement('select', {value: this.state.change, onChange: this.handleChange}, statusOptions);
        var selectCol = React.createElement('div', {className: 'col-md-2 text-center col-sm-1'}, selectStatus);
        var breakRow = React.createElement('div', {className: 'row'}, [user, timeSubmitted, timeUpdated, nextPunchout, status, posture, selectCol]);
        return React.createElement('li', {className: 'list-group-item'}, breakRow);
    }

    createStatusOptions(){
        var noChange = React.createElement('option', {value: ''}, '');
        var clearing = React.createElement('option', {value: 'clearing'}, `Clearing`);
        var breaking = React.createElement('option', {value: 'breaking'}, `Breaking`);
        var returned = React.createElement('option', {value: 'returned'}, `Returned`);
        var cancelled = React.createElement('option', {value: 'cancelled'}, `Cancelled`);
        var skipped = React.createElement('option', {value: 'skipped'}, `Skipped`);
        var queued = React.createElement('option', {value: 'queued'}, `Queued`);
        var statusOptions = [noChange, clearing, breaking, returned, cancelled, skipped, queued];
        return statusOptions;
    }

}

 
var reactHolder = document.createElement('div');
var docBody = document.getElementById('wpbody-content');
docBody.appendChild(reactHolder);
ReactDOM.render(
    React.createElement(BreaksAdminView, {}, null), reactHolder
);
