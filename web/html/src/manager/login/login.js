import React, {useEffect, useRef} from 'react';
import {hot} from 'react-hot-loader';
import {Messages} from '../../components/messages';
import {AsyncButton} from '../../components/buttons';
import useLoginApi from '../../shared/core/api/use-login-api';
import styles from './login.css';

import LoginHeader from './login-header';
import LoginFooter from "./login-footer";
import {useInputValue} from "components/hooks/forms/useInputValue";

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

const getGlobalMessages = (validationErrors, schemaUpgradeRequired) => {
  let messages = [];

  if (!validationErrors || !validationErrors.length) {
    messages = [].concat(validationErrors.map(msg => ({ severity: 'error', text: msg })))
  }

  if (schemaUpgradeRequired) {
    const schemaUpgradeError = t('A schema upgrade is required. Please upgrade your schema at your earliest convenience to receive latest bug fixes and avoid potential problems.')
    messages.concat({ severity: 'error', text: schemaUpgradeError });
  }

  return messages;
}

const getFormMessages = (success, messages) => {
  if (success) {
    return [{severity: "success", text: <p>{t('Successfully logged in! Redirecting...')}.</p>}];
  }

  if (messages.length > 0) {
    return messages.map(msg => ({ severity: 'error', text: msg }));
  }

  return [];
};

const Login = (props: Props) => {


  let loginInput = useInputValue('');
  let passwordInput = useInputValue('');
  let {onLogin, success, messages} = useLoginApi({bounce: props.bounce});
  const loginInputRef = useRef();

  useEffect(() => {
    loginInputRef.current.focus();
  }, []);

  const product = props.isUyuni ? products.uyuni : products.suma;

  return (
    <React.Fragment>

      <LoginHeader
        title={product.title}
        text={product.headerTitle}
        customHeader={props.customHeader}/>

      <div className={`spacewalk-main-column-layout ${styles.fixed_content}`}>
        <section id="spacewalk-content">
          <div className="wrap">
            <div name="container">
              <Messages items={getGlobalMessages(props.validationErrors, props.schemaUpgradeRequired)} />
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
                  <Messages items={getFormMessages(success, messages)} />
                  <h2 className="Raleway-font gray-text">{t('Sign In')}</h2>
                  <form name="loginForm">
                    <div className="margins-updown">
                      <input
                        name="login"
                        className="form-control"
                        type="text"
                        placeholder={t('Login')}
                        ref={loginInputRef}
                        {...loginInput} />
                      <input
                        name="password"
                        className="form-control"
                        type="password"
                        placeholder={t('Password')}
                        {...passwordInput}/>
                      <AsyncButton
                        id="login-btn"
                        className="btn-block"
                        defaultType="btn-success"
                        text={t('Sign In')}
                        action={() => onLogin({ login: loginInput.value, password: passwordInput.value })}
                      />
                    </div>
                  </form>
                  <hr/>
                </div>
              </React.Fragment>
            </div>
          </div>
        </section>
      </div>

      <LoginFooter
        productName={props.productName}
        customFooter={props.customFooter}
        webVersion={props.webVersion} />

    </React.Fragment>
  );
}

export default hot(module)(Login);
