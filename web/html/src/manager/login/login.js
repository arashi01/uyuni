import React from 'react';
import { hot } from 'react-hot-loader';
import { Messages } from '../../components/messages';
import { AsyncButton } from '../../components/buttons';
import LoginApi from '../../shared/core/api/login-api';
import styles from './login.css';

import LoginHeader from './login-header';
import LoginFooter from "./login-footer";

const products = {
  suma: {
    key: "SUSE Manager",
    headerTitle: <React.Fragment><span>SUSE</span><i className="fa fa-registered" /><span>Manager</span></React.Fragment>,
    bodyTitle: <span>SUSE<br />{' '}Manager</span>,
    url: 'http://www.suse.com/products/suse-manager/',
    title: 'SUSE Manager login page',
  },
  uyuni: {
    key: "Uyuni",
    headerTitle: 'Uyuni',
    bodyTitle: 'Uyuni',
    url: 'http://www.uyuni-project.org/',
    title: 'Uyuni login page',
  },
};

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.userNameInputRef = React.createRef();
    this.state = {
      login: '',
      password: '',
    };
  }

  componentDidMount() {
    this.userNameInputRef.current.focus();
  }

  loginChanged = (event) => {
    this.setState({
      login: event.target.value,
    });
  };

  passwordChanged = (event) => {
    this.setState({
      password: event.target.value,
    });
  };

  renderValidationErrors = (validationErrors) => {
    if (!this.validationErrors || !this.validationErrors.length) {
      return <Messages items={validationErrors.map(msg => ({ severity: 'error', text: msg }))} />;
    }
    return (null);
  }

  renderSchemaUpgradeRequired = (schemaUpgradeRequired) => {
    if (schemaUpgradeRequired) {
      const schemaUpgradeError = t('A schema upgrade is required. Please upgrade your schema at your earliest convenience to receive latest bug fixes and avoid potential problems.')
      return <Messages items={[{ severity: 'error', text: schemaUpgradeError }]} />;
    }
  }

  renderMessages = ({ success, messages }) => {
    if (success) {
      return <Messages items={[{severity: "success", text:
          <p>{t('Successfully logged in! Redirecting...')}.</p>
      }]} />;
    }

    if (messages.length > 0) {
      return <Messages items={messages.map(msg => ({ severity: 'error', text: msg }))} />;
    }

    return (null);
  };

  render() {
    const product = this.props.isUyuni ? products.uyuni : products.suma;

    return (
      <React.Fragment>

        <LoginHeader
          title={product.title}
          text={product.headerTitle}
          customHeader={this.props.customHeader}/>

        <div className={`spacewalk-main-column-layout ${styles.fixed_content}`}>
          <section id="spacewalk-content">
            <div className="wrap">
              <div name="container">
                {
                  this.renderValidationErrors(this.props.validationErrors)
                }
                {
                  this.renderSchemaUpgradeRequired(this.props.schemaUpgradeRequired)
                }
                <LoginApi bounce={this.props.bounce}>
                  {
                    ({
                      onLogin,
                      success,
                      loading,
                      messages,
                    }) => (
                      <React.Fragment>
                        <div className="col-sm-6">
                          <h1 className="Raleway-font">{product.bodyTitle}</h1>
                          <p className="gray-text margins-updown">
                            Discover a new way of managing your servers, packages, patches and more via one interface.
                          </p>
                          <p className="gray-text">
                            Learn more about {product.key}:
                            <a href={product.url} className="btn-dark" target="_blank"> View website</a>
                          </p>
                        </div>
                        <div className="col-sm-5 col-sm-offset-1">
                          {
                            this.renderMessages({ success, messages })
                          }
                          <h2 className="Raleway-font gray-text">{t('Sign In')}</h2>
                          <form name="loginForm">
                            <div className="margins-updown">
                              <input
                                name="login"
                                className="form-control"
                                type="text"
                                placeholder={t('Login')}
                                value={this.state.login}
                                onChange={this.loginChanged}
                                ref={this.userNameInputRef}
                              />
                              <input
                                name="password"
                                className="form-control"
                                type="password"
                                placeholder={t('Password')}
                                value={this.state.password}
                                onChange={this.passwordChanged}
                              />
                              <AsyncButton
                                id="login-btn"
                                className="btn-block"
                                defaultType="btn-success"
                                text={t('Sign In')}
                                action={() => onLogin({ login: this.state.login, password: this.state.password })}
                              />
                            </div>
                          </form>
                          <hr />
                        </div>
                      </React.Fragment>
                    )}
                </LoginApi>
              </div>
            </div>
          </section>
        </div>

        <LoginFooter
          productName={this.props.productName}
          customFooter={this.props.customFooter}
          webVersion={this.props.webVersion} />

      </React.Fragment>
    );
  }
}

export default hot(module)(Login);
