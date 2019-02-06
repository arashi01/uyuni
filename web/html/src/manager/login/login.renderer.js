import Login from "./login";
import ReactDOM from "react-dom";
import React from "react";

window.pageRenderers = window.pageRenderers || {};
window.pageRenderers.login = window.pageRenderers.login || {};
window.pageRenderers.login.renderer = (id, {isUyuni, urlBounce, validationErrors, schemaUpgradeRequired}) => ReactDOM.render(
  <Login
    isUyuni={isUyuni}
    bounce={urlBounce}
    validationErrors={validationErrors}
    schemaUpgradeRequired={schemaUpgradeRequired}
  />,
  document.getElementById(id)
);
