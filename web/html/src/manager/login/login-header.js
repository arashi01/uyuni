import React from 'react';

const LoginHeader = (props) => {
  return (
    <header className="navbar-pf Raleway-font">
        <div className="wrap">
          <a href="/" target="" title={props.title} className="navbar-brand">
            <i className="fa fa-home"></i>
            <span>{props.text}</span>
          </a>
          <div className="navbar-header">
            <div className="custom-text">
              {props.customHeader}
            </div>
          </div>
          <ul className="nav navbar-nav navbar-utility">
            <li>
              <a href="/rhn/help/about.do" className="about-link">About</a>
            </li>
          </ul>
        </div>
    </header>
  );
};

export default LoginHeader;
