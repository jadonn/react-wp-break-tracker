class BreaksFormView extends React.Component{
    constructor(props){
        super(props);
        this.state = {user: '', posture: breaksFormOptions.postures[0], next_punchout: '0:00', userInputError: '', hideUserInputError: true, formSuccessNotification: '', hideFormSuccessNotification: true, formFailureNotification: '', hideFormFailureNotification: true};
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    render(){
        
        var postureOptions = breaksFormOptions.postures.map(function(posture){
            return React.createElement('option', {value: posture}, posture);
        });
        var punchoutOptions = [];
        for(var index = 0; index <= 23; index++){
            var timeStringHourTop = index.toString().concat(':00');
            punchoutOptions.push(React.createElement('option', {value: timeStringHourTop}, timeStringHourTop));
            var timeStringHourBottom = index.toString().concat(':30');
            punchoutOptions.push(React.createElement('option', {value: timeStringHourBottom}, timeStringHourBottom));
        }
        var formRows = [React.createElement('div', {className: 'row'}, [
                React.createElement('div', {className: 'col-md-2'}, React.createElement('label', {}, `User`)),
                React.createElement('div', {className: 'col-md-2'}, React.createElement('input', {name: 'user', className: 'front-width', value: this.state.user, onChange: this.handleChange}, null)),
            ]),
            React.createElement('div', {className: 'row'}, [
                React.createElement('div', {className: 'col-md-4 alert-danger', hidden: this.state.hideUserInputError}, this.state.userInputError)
            ]),
            React.createElement('div', {className: 'row'}, [
                React.createElement('div', {className: 'col-md-2'}, React.createElement('label', {}, `Posture`)),
                React.createElement('div', {className: 'col-md-2'}, React.createElement('select', {name: 'posture', className: 'front-width', value: this.state.posture, defaultValue: breaksFormOptions.postures[0], onChange: this.handleChange}, postureOptions)),
            ]),
            React.createElement('div', {className: 'row'}, [
                React.createElement('div', {className: 'col-md-2'}, React.createElement('label', {}, `Next Punchout`)),
                React.createElement('div', {className: 'col-md-2'}, React.createElement('select', {name: 'next_punchout', className: 'front-width', value: this.state.next_punchout, onChange: this.handleChange}, punchoutOptions)),
            ]),
            React.createElement('div', {className: 'row'}, [
                React.createElement('div', {className: 'col-md-2 col-md-offset-3'}, 
                React.createElement('button', {className: 'btn btn-default', onClick: this.handleSubmit}, `Submit`))
            ]),
            React.createElement('div', {className: 'row'}, [
                React.createElement('div', {className: 'col-md-4'},
                React.createElement('div', {className: 'alert alert-success', hidden: this.state.hideFormSuccessNotification}, this.state.formSuccessNotification))
            ]),
            React.createElement('div', {className: 'row'}, [
                React.createElement('div', {className: 'col-md-4'},
                React.createElement('div', {className: 'alert alert-danger', hidden: this.state.hideFormFailureNotification}, this.state.formFailureNotification))
            ])
        ];
        return React.createElement('div', {className: 'container'}, formRows);
    }

    handleChange(event){
        const target = event.target;
        const value = target.value;
        const name= target.name;
        this.setState({
            [name]: value
        });
    }
    handleSubmit(){
        var self = this;
        var breakSubmission = new XMLHttpRequest();
        if(this.state.user === ''){
            self.setState({userInputError: 'Please enter a username.', hideUserInputError: false}, function(){
                setTimeout(function(){self.setState({userInputError: '', hideUserInputError: true})}, 10000);
            });
            return;
        }
        breakSubmission.open("POST", "/wp-json/breaks/v1/route");
        breakSubmission.addEventListener('load', function(response){
            self.setState({user: '', posture: breaksFormOptions.postures[0], next_punchout: '0:00',});
            let parsedResponse = JSON.parse(this.response);
            if(parsedResponse.success === true){
                self.setState({formSuccessNotification: parsedResponse.result, hideFormSuccessNotification: false}, function(){setTimeout(function(){
                    self.setState({formSuccessNotification: '', hideFormSuccessNotification: true});
                }, 30000)});
            }else{
                self.setState({formFailureNotification: parsedResponse.result, hideFormFailureNotification: false}, function(){setTimeout(function(){
                    self.setState({formFailureNotification: '', hideFormFailureNotification: true});
                }, 30000)});
            }
        })
        breakSubmission.send(JSON.stringify(this.state));
    }
}

var reactHolder = document.createElement('div');
var docBody = document.getElementsByClassName('main')[0];
docBody.appendChild(reactHolder);
ReactDOM.render(
    React.createElement(BreaksFormView, {}, null), reactHolder
);