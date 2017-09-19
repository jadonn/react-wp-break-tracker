class BreaksListView extends React.Component{
    constructor(props){
        super(props);
        this.state = {};
        this.breaks = [];
        this.fetchBreaks = this.fetchBreaks.bind(this);
        this.fetchBreaks();
    }
    
    render(){
        this.breakElements = this.breaks.map(function(breakData){
            return React.createElement(Break, {data: breakData}, null);
        }, this);
        var heading = React.createElement('h1', {}, `Active Breaks`);
        var rowHeading = this.createHeading();
        var breakList = React.createElement('ul', {className: 'list-group'}, [rowHeading, this.breakElements]);
        var mainContainer = React.createElement('div', {className: 'container'}, [heading, breakList]);
        return mainContainer;
    }

    fetchBreaks(){
        var self = this;
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
        var userHeading = React.createElement('div', {className: 'col-md-2 text-center col-sm-1'}, userText);
        var timeSubmittedText = React.createElement('strong', {}, `Time Submitted`);
        var timeSubmittedHeading = React.createElement('div', {className: 'col-md-2 text-center col-sm-1'}, timeSubmittedText);
        var timeUpdatedText = React.createElement('strong', {}, `Time Updated`);
        var timeUpdatedHeading = React.createElement('div', {className: 'col-md-2 text-center col-sm-2'}, timeUpdatedText);
        var nextPunchoutText = React.createElement('strong', {}, `Next Punchout`);
        var nextPunchoutHeading = React.createElement('div', {className: 'col-md-2 text-center col-sm-2'}, nextPunchoutText);
        var statusText = React.createElement('strong', {}, `Status`);
        var statusHeading = React.createElement('div', {className: 'col-md-2 text-center col-sm-1'}, statusText);
        var postureText = React.createElement('strong', {}, `Posture`);
        var postureHeading = React.createElement('div', {className: 'col-md-2 text-center col-sm-1'}, postureText);
        var breakHeadingRow = React.createElement('div', {className: 'row'}, [userHeading, timeSubmittedHeading, timeUpdatedHeading, nextPunchoutHeading, statusHeading, postureHeading]);
        return React.createElement('li', {className: 'list-group-item'}, breakHeadingRow);
    }
}

class Break extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        var user = React.createElement('div', {className: 'col-md-2 text-center col-sm-1'}, this.props.data.user);
        var timeSubmitted = React.createElement('div', {className: 'col-md-2 text-center col-sm-1'}, this.props.data.time_submitted);
        var timeUpdated = React.createElement('div', {className: 'col-md-2 text-center col-sm-2'}, this.props.data.time_updated);
        var nextPunchout = React.createElement('div', {className: 'col-md-2 text-center col-sm-2'}, this.props.data.next_punchout);
        var status = React.createElement('div', {className: 'col-md-2 text-center col-sm-1 '.concat(this.props.data.status)}, this.props.data.status);
        var posture = React.createElement('div', {className: 'col-md-2 text-center col-sm-1 '.concat(this.props.data.posture), style: {backgroundColor: breaksOptions.posture_colors[this.props.data.posture]}}, this.props.data.posture);
        var breakRow = React.createElement('div', {className: 'row'}, [user, timeSubmitted, timeUpdated, nextPunchout, status, posture]);
        return React.createElement('li', {className: 'list-group-item'}, breakRow);
    }

}

 
var reactHolder = document.createElement('div');
var docBody = document.getElementsByClassName('main')[0];
docBody.appendChild(reactHolder);
ReactDOM.render(
    React.createElement(BreaksListView, {}, null), reactHolder
);
