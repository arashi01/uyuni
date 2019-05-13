import Login from "./login";
import ReactDOM from "react-dom";
import React from "react";

window.pageRenderers = window.pageRenderers || {};
window.pageRenderers.login = window.pageRenderers.login || {};
window.pageRenderers.login.renderer = (id, {urlBounce}) => ReactDOM.render(
  <Login
    bounce={urlBounce}
  />,
  document.getElementById(id)
);
