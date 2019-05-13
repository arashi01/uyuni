'use strict';

const React = require("react");
const ReactDOM = require("react-dom");
const Panel = require("../components/panel").Panel;
const Messages = require("../components/messages").Messages;
const Network = require("../utils/network");
const {AsyncButton, LinkButton} = require("../components/buttons");

class Login extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            login: "",
            password: "",
            bounce: urlBounce,
            messages: [],
            loading: false
        };
        ["loginChanged", "passwordChanged", "onLogin"].forEach(method => this[method] = this[method].bind(this));
    }

    loginChanged(event) {
        this.setState({
            login: event.target.value
        });
    }

    passwordChanged(event) {
        this.setState({
            password: event.target.value
        });
    }

    onLogin() {
        this.setState({loading: true});
        var formData = {};
        formData['login'] = this.state.login.trim();
        formData['password'] = this.state.password.trim();

        const request = Network.post(
            "/rhn/manager/api/login",
            JSON.stringify(formData),
            "application/json"
        ).promise.then(data => {
            this.setState({
                success: data.success,
                messages: data.messages,
                loading: false
            });

            // Redirect in case of success
            if (this.state.success) {
                window.location.replace(this.state.bounce);
            }
        }, (xhr) => {
            try {
                this.setState({
                    success: false,
                    messages: [JSON.parse(xhr.responseText)],
                    loading: false
                })
            } catch (err) {
                var errMessages = xhr.status == 0 ?
                    [t("Request interrupted or invalid response received from the server. Please try again.")]
                    : [Network.errorMessageByStatus(xhr.status)];
                this.setState({
                    success: false,
                    messages: errMessages,
                    loading: false
                })
            }
        });
        return request;
    }

    render() {
        var messages = undefined;
        if (this.state.success) {
            messages = <Messages items={[{severity: "success", text:
                <p>{t('Successfully logged in! Redirecting...')}.</p>
            }]}/>;
        } else if (this.state.messages.length > 0) {
            messages = <Messages items={this.state.messages.map(function(msg) {
                return {severity: "error", text: msg};
            })}/>;
        }

        var buttons = [
            <AsyncButton id="login-btn" defaultType="btn-success btn-block" name={t("Sign In")} action={this.onLogin}/>,
        ];

        return (
            <div className="col-sm-5 col-sm-offset-1">
                {messages}
                <h2 className="Raleway-font gray-text">{t("Sign In")}</h2>
                <div className="margins-updown">
                    <input name="login" className="form-control" type="text" placeholder={t("Login")} value={this.state.login} onChange={this.loginChanged}/>
                    <input name="password" className="form-control" type="password" placeholder={t("Password")} value={this.state.password} onChange={this.passwordChanged}/>
                    {buttons}
                </div>
            </div>
        )
    }

    componentDidMount() {
        window.addEventListener("beforeunload", (e) => {
            if (this.state.loading) {
                var confirmationMessage = "Are you sure you want to close this page while login is in progress?";
                (e || window.event).returnValue = confirmationMessage;
                return confirmationMessage;
            }
        })
    }
}

ReactDOM.render(
    <Login />,
    document.getElementById('login')
);
