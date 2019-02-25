import React from 'react';
import ReactDOM from 'react-dom';
import Project from './project';

window.pageRenderers = window.pageRenderers || {};
window.pageRenderers.contentManagement = window.pageRenderers.contentManagement || {};
window.pageRenderers.contentManagement.project = window.pageRenderers.contentManagement.project || {};
window.pageRenderers.contentManagement.project.renderer = (id, {project, wasFreshlyCreatedMessage} = {}) => {
  let projectJson = {};
  try{
    projectJson = JSON.parse(project);
  }  catch(error) {}

  ReactDOM.render(
    <Project
      project={projectJson}
      { ...( wasFreshlyCreatedMessage && { wasFreshlyCreatedMessage } ) }
    />,
    document.getElementById(id),
  );
};
