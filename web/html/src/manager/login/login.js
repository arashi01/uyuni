import React from "react";
import {Messages} from "../../components/messages";
import {AsyncButton} from "../../components/buttons";
import LoginApi from "../../shared/core/api/login-api";

const products = {
  suma: {
    title: <span>SUSE<br/> Manager</span>,
    url: 'http://www.suse.com/products/suse-manager/'
  },
  uyuni: {
    title: 'Uyuni',
    url: 'http://www.uyuni-project.org/'
  },
}

const schemaUpgradeRequiredMessage = {
  true: "A schema upgrade is required. Please upgrade your schema at your earliest convenience to receive latest bug fixes and avoid potential problems.",
  false: ''
}

class Login extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      login: "",
      password: "",
    };
  }

  loginChanged = (event) => {
    this.setState({
      login: event.target.value
    });
  };

  passwordChanged = (event) => {
    this.setState({
      password: event.target.value
    });
  };

  renderValidationErrors = (validationErrors) => {
    if (!this.validationErrors || !this.validationErrors.length) {
      return  <Messages items={validationErrors.map((msg) => ({ severity: "error", text: msg }) )} />;
    }
    return (null);
  }

  renderSchemaUpgradeRequired = (schemaUpgradeRequired) => {
    if (schemaUpgradeRequired) {
      return  <Messages items={[{severity: "error", text: schemaUpgradeRequiredMessage[schemaUpgradeRequired]} ]} />;
    }
  }

  renderMessages = ({success, messages}) => {
    if (success) {
      return <Messages items={[{severity: "success", text:
          <p>{t('Successfully logged in! Redirecting...')}.</p>
      }]} />;
    }

    if (messages.length > 0) {
      return  <Messages items={messages.map((msg) => ({ severity: "error", text: msg }) )} />;
    }

    return (null);
  };

  render() {

    const product = this.props.isUyuni ? products.uyuni : products.suma;

    return (
      <LoginApi bounce={this.props.bounce}>
        {
          ({
             onLogin,
             success,
             loading,
             messages,
           }) => (
            <div name="container">
                {
                  this.renderValidationErrors(this.props.validationErrors)
                }
                {
                  this.renderSchemaUpgradeRequired(this.props.schemaUpgradeRequired)
                }
              <form name="loginForm">
                <div className="col-sm-6">
                  <h1 className="Raleway-font">{product.title}</h1>
                  <p className="gray-text margins-updown">
                    Discover a new way of managing your servers, packages, patches and more via one interface.
                  </p>
                  <p className="gray-text">
                    Learn more about Uyuni: <a href={product.url} className="btn-dark" target="_blank"> View website</a>
                  </p>
                </div>
                <div className="col-sm-5 col-sm-offset-1">
                  {
                    this.renderMessages({success, messages})
                  }
                  <h2 className="Raleway-font gray-text">{t("Sign In")}</h2>
                  <div className="margins-updown">
                    <input name="login" className="form-control" type="text" placeholder={t("Login")}
                          value={this.state.login} onChange={this.loginChanged}/>
                    <input name="password" className="form-control" type="password" placeholder={t("Password")}
                          value={this.state.password} onChange={this.passwordChanged}/>
                    <AsyncButton
                      id="login-btn"
                      defaultType="btn-success btn-block"
                      text={t("Sign In")}
                      action={() => onLogin({login: this.state.login, password: this.state.password})}/>
                  </div>
                </div>
              </form>
            </div>
          )
        }
      </LoginApi>
    )
  }
}

export default Login;
