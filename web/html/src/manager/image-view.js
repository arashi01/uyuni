'use strict';

const React = require("react");
const ReactDOM = require("react-dom");
const {AsyncButton, Button} = require("../components/buttons");
const Panel = require("../components/panel").Panel;
const Network = require("../utils/network");
const Utils = require("../utils/functions").Utils;
const {Table, Column, SearchField} = require("../components/table");
const Messages = require("../components/messages").Messages;
const MessagesUtils = require("../components/messages").Utils;
const {ModalButton, ModalLink, DeleteDialog} = require("../components/dialogs");
const PopUp = require("../components/popup").PopUp;
const TabContainer = require("../components/tab-container").TabContainer;
const ImageViewOverview = require("./image-view-overview").ImageViewOverview;
const ImageViewPatches = require("./image-view-patches").ImageViewPatches;
const ImageViewPackages = require("./image-view-packages").ImageViewPackages;
const ImageViewRuntime = require("./image-view-runtime").ImageViewRuntime;
const DateTime = require("../components/datetime").DateTime;

/* global isAdmin, isRuntimeInfoEnabled */

const msgMap = {
  "not_found": "Image cannot be found.",
  "cluster_info_err":
      "Cannot retrieve data from cluster '{0}'. Please check the logs and make sure the cluster API is accessible.",
  "image_overview_not_found":
      "Image overview not found."
};

const hashUrlRegex = /^#\/([^/]*)\/(\d*)$/;

function getHashId() {
  const match = window.location.hash.match(hashUrlRegex);
  return match ? match[2] : undefined;
}

function getHashTab() {
  const match = window.location.hash.match(hashUrlRegex);
  return match ? match[1] : undefined;
}

class ImageView extends React.Component {

  constructor(props) {
    super(props);
    ["reloadData", "handleBackAction", "handleDetailsAction", "deleteImages",
        "inspectImage", "buildImage", "handleImportImage"]
            .forEach(method => this[method] = this[method].bind(this));
    this.state = {
      messages: [],
      images: [],
      imagesRuntime: {},
      selectedItems: []
    };

    this.updateView(getHashId(), getHashTab());
    window.addEventListener("popstate", () => {
      this.updateView(getHashId(), getHashTab());
    });
  }

  pushMessages(severity, messages) {
    const add = this.state.messages;

    const getMsgObj = (msg) => {
      if(typeof msgMap[msg] === "string") {
        return {severity: severity, text: msgMap[msg]};
      }
      else {
        return {severity: severity, text: msg};
      }
    };

    if(Array.isArray(messages)) {
      add.concat(messages.map(getMsgObj));
    } else {
      add.push(getMsgObj(messages));
    }

    this.setState({messages: add});
  }

  updateView(id, tab) {
    id ? this.getImageInfoDetails(id, tab) : this.getImageInfoList();
    this.clearMessages();
  }

  reloadData() {
    this.updateView(this.state.selected ? this.state.selected.id : undefined, getHashTab());
  }

  clearMessages() {
    this.setState({
      messages: []
    });
  }

  handleBackAction() {
    return this.getImageInfoList().then(() => {
      const loc = window.location;
      history.pushState(null, null, loc.pathname + loc.search);
      this.clearMessages();
    });
  }

  handleDetailsAction(row) {
    const tab = getHashTab() || 'overview';
    this.getImageInfoDetails(row.id, tab).then(() => {
      history.pushState(null, null, '#/' + tab + '/' + row.id);
      this.clearMessages();
    });

    this.setState({selectedRuntime: undefined});
  }

  handleImportImage() {
    Utils.urlBounce("/rhn/manager/cm/import");
  }

  handleResponseError(jqXHR, arg = "") {
    this.setState({
      messages:
            Network.responseErrorMessage(
              jqXHR,
              (status, msg) => msgMap[msg] ? t(msgMap[msg], arg) : null
            )
    });
  }

  //Accumulate runtime data from individual clusters into 'toData'
  mergeRuntimeList(data, toData) {
    Object.keys(data).forEach(imgId => {
      const clusterData = data[imgId];

      if(toData[imgId] === undefined) {
        toData[imgId] = clusterData;
        return;
      }
      this.mergeRuntimeData(clusterData, toData[imgId]);
    });

    return toData;
  }

  //Accumulate runtime data for a single image from individual clusters into 'toData'
  mergeRuntimeData(data, toData) {
    if(toData.instances === undefined) toData.instances = {};

    if(data.instances) {
      toData.instances = toData.instances || {};
      Object.keys(data.instances).forEach(cluster => {
        toData.instances[cluster] = data.instances[cluster];
      });
    }

    if(data.clusters) {
      toData.clusters = toData.clusters || {};
      Object.keys(data.clusters).forEach(cluster => {
        toData.clusters[cluster] = data.clusters[cluster];
      });
    }

    toData.runtimeStatus = Math.max(toData.runtimeStatus || 0, data.runtimeStatus);

    return toData;
  }

  getImageInfoList() {
    let listPromise = Network.get("/rhn/manager/api/cm/images").promise
      .then(data => this.setState({selected: undefined, images: data}))
      .catch(this.handleResponseError);
    let updatedData = {};
    if (this.props.runtimeInfoEnabled) {
      this.setState({imagesRuntime: {}});
      //Get a list of cluster ids
      Network.get("/rhn/manager/api/cm/clusters").promise.then(data => {
        const runtimeUrl = "/rhn/manager/api/cm/runtime/";
        //Get runtime data for each individual cluster
        data.forEach(cluster =>
          Network.get(runtimeUrl + cluster.id).promise
            .then(data =>
              this.setState({
                imagesRuntime: this.mergeRuntimeList(data.data, updatedData)
              })
            )
            .catch(jqXHR => {
                this.handleResponseError(jqXHR, cluster.label);
                this.setState({ runtimeInfoErr: true});
            })
        )
      })
      .catch(jqXHR => {
        this.handleResponseError(jqXHR);
        this.setState({ runtimeInfoErr: true});
      });
    }

    return listPromise;
  }

  getImageInfoDetails(id, tab) {
    let url;
    if(tab === "patches" || tab === "packages")
      url = "/rhn/manager/api/cm/images/" + tab + "/" + id;
    else //overview, runtime
      url = "/rhn/manager/api/cm/images/" + id;

    let detailsPromise = Network.get(url).promise.then(data => {
      this.setState({selected: data});
    })
      .catch(this.handleResponseError);

    let updatedData = {};
    if (this.props.runtimeInfoEnabled) {
      //Get a list of cluster ids
      Network.get("/rhn/manager/api/cm/clusters").promise.then(data => {
            const runtimeUrl = (tab === "runtime" ? "/rhn/manager/api/cm/runtime/details/" : "/rhn/manager/api/cm/runtime/");
            //Get runtime data for each individual cluster
            if (data.length == 0) {
              this.setState({
                selectedRuntime: {
                  clusters: [],
                  pods: []
                },
                runtimeInfoErr: false
              });
            }
            data.forEach(cluster =>
              Network.get(runtimeUrl + cluster.id + "/" + id).promise
                .then(data =>
                  this.setState({
                    selectedRuntime: this.mergeRuntimeData(data.data, updatedData),
                    runtimeInfoErr: false
                  })
                )
                .catch(jqXHR => {
                  this.handleResponseError(jqXHR, cluster.label);
                  this.setState({ runtimeInfoErr: true  });
                })
            )
      })
      .catch(jqXHR => {
          this.handleResponseError(jqXHR);
          this.setState({
            runtimeInfoErr: true
          });
      });
    }

    return detailsPromise;
  }

  deleteImages(idList) {
    return Network.post("/rhn/manager/api/cm/images/delete",
      JSON.stringify(idList), "application/json").promise.then(() => {
        // Waits for the 'Back' action if not in the list page
        const backAction = this.state.selected ? this.handleBackAction() : Promise.resolve();
        backAction.then(() =>
          this.setState({
            images: this.state.images.filter(img => !idList.includes(img.id)),
            selectedItems: this.state.selectedItems.filter(item => !idList.includes(item)),
            messages: MessagesUtils.info(t("Deleted successfully."))
          }));
      })
      .catch(this.handleResponseError);
  }

  inspectImage(id, earliest) {
    return Network.post("/rhn/manager/api/cm/images/inspect/" + id,
      JSON.stringify({imageId: id, earliest: earliest}),
      "application/json").promise.then(() => {
      this.reloadData();
      this.setState({
        messages: MessagesUtils.info(t("Image inspect has been scheduled."))
      });
    })
      .catch(this.handleResponseError);
  }

  buildImage(profile, version, host, earliest) {
    return Network.post("/rhn/manager/api/cm/build/" + profile,
      JSON.stringify({version: version, buildHostId: host, earliest: earliest}),
      "application/json").promise.then(() => {
      //The image id is changed so this page is not available anymore.
      this.handleBackAction();
      this.setState({
        messages: MessagesUtils.info(t("Image build has been scheduled."))
      });
    })
      .catch(this.handleResponseError);
  }

  render() {
    const panelButtons = <div className="pull-right btn-group">
      { isAdmin && this.state.selectedCount > 0 && !this.state.selected &&
          <ModalButton id="delete-selected" icon="fa-trash" className="btn-default" text={t("Delete")}
            title={t("Delete selected")} target="delete-selected-modal"/>
      }
      { isAdmin && this.state.selected &&
          <ModalButton id="delete-single" icon="fa-trash" className="btn-default" text={t("Delete")}
            title={t("Delete Image")} target="delete-modal"/>
      }
      { isAdmin && !this.state.selected &&
          <Button id="import" icon="fa-download" text={t("Import")} className="btn-default" handler={this.handleImportImage} />
      }
      <AsyncButton id="reload" icon="refresh" name={t("Refresh")} text action={this.reloadData} />
    </div>;

    const selected = Object.assign({}, this.state.selected, this.state.selectedRuntime);
    const list = this.state.images.map(i => Object.assign({}, i, this.state.imagesRuntime[i.id]));

    return (
      <span>
        <Panel title={this.state.selected ? this.state.selected.name : t("Images")} icon={this.state.selected ? "fa-hdd-o" : "fa-list"} button={ panelButtons }>
          { this.state.messages.length > 0 && <Messages items={this.state.messages}/> }
          { this.state.selected ?
            <ImageViewDetails data={selected} onTabChange={() => this.updateView(getHashId(), getHashTab())}
              onCancel={this.handleBackAction} onInspect={this.inspectImage} onBuild={this.buildImage}
              runtimeInfoEnabled={this.props.runtimeInfoEnabled} runtimeInfoErr={this.state.runtimeInfoErr}
              onDelete={(item) => this.deleteImages([item.id])}/>
            :
            <ImageViewList data={list} onSelectCount={(c) => this.setState({selectedCount: c})}
              onSelect={this.handleDetailsAction} onDelete={this.deleteImages}
              runtimeInfoEnabled={this.props.runtimeInfoEnabled} runtimeInfoErr={this.state.runtimeInfoErr}/>
          }
        </Panel>

      </span>
    );
  }
}

class ImageViewList extends React.Component {
  constructor(props) {
    super(props);

    ["selectImage", "handleSelectItems", "renderRuntimeIcon", "renderInstances"]
      .forEach(method => this[method] = this[method].bind(this));
    this.state = {
      selectedItems: [],
      instancePopupContent: {}
    };
    this.props.onSelectCount(0);
  }

  searchData(row, criteria) {
    if (criteria) {
      return row.name.toLocaleLowerCase().includes(criteria.toLocaleLowerCase()) ||
                row.version.toLocaleLowerCase().includes(criteria.toLocaleLowerCase());

    }
    return true;
  }

  isFiltered(criteria) {
    return criteria && criteria.length > 0;
  }

  selectImage(row) {
    this.setState({
      selected: row
    });
  }

  handleSelectItems(items) {
    this.setState({
      selectedItems: items
    });
    this.props.onSelectCount(items.length);
  }

  renderUpdatesIcon(row) {
    let icon;

    if(!row.patches || row.installedPackages === 0) {
      icon = <i className="fa fa-question-circle fa-1-5x" title="No information"/>
    } else if (row.patches.critical > 0) {
      icon = <i className="fa fa-exclamation-circle fa-1-5x text-danger" title={"Critical updates available"}/>
    } else if (row.patches.noncritical > 0) {
      icon = <i className="fa fa-exclamation-triangle fa-1-5x text-warning" title={"Non-critical updates available"}/>
    } else if (row.packages > 0) {
      icon = <i className="fa fa-exclamation-triangle fa-1-5x text-warning" title={"Package updates available"}/>
    } else {
      icon = <i className="fa fa-check-circle fa-1-5x text-success" title="Image is up to date"/>
    }

    return icon;
  }

  renderStatusIcon(row) {
    let icon;
    if(row.external) {
      icon = <i className="fa fa-minus-circle fa-1-5x text-muted" title="Built externally"/>
    } else if(row.statusId === 0) {
      icon = <i className="fa fa-clock-o fa-1-5x" title="Queued"/>
    } else if(row.statusId === 1) {
      icon = <i className="fa fa-exchange fa-1-5x text-info" title="Building"/>
    } else if(row.statusId === 2) {
      icon = <i className="fa fa-check-circle fa-1-5x text-success" title="Built"/>
    } else if(row.statusId === 3) {
      icon = <i className="fa fa-times-circle-o fa-1-5x text-danger" title="Failed"/>
    } else {
      icon = <i className="fa fa-question-circle fa-1-5x" title="Unknown"/>
    }

    return icon;
  }

  renderRuntimeIcon(row) {
    let icon = <i className="fa fa-circle-o-notch fa-spin fa-1-5x" title={t("Waiting for update ...")}/>;
    if (this.props.runtimeInfoErr) {
      return null;
    }
    if (row.runtimeStatus === 0) {
        icon = <span>-</span>;
    }
    else if (row.runtimeStatus === 1) {
      icon = <i className="fa fa-check-circle fa-1-5x text-success" title={t("All instances are consistent with SUSE Manager")}/>
    } else if (row.runtimeStatus === 2) {
      icon = <i className="fa fa-question-circle fa-1-5x" title={t("No information")}/>
    } else if (row.runtimeStatus === 3) {
      icon = <i className="fa fa-exclamation-triangle fa-1-5x text-warning" title={t("Outdated instances found")}/>
    }

    return icon;
  }

  renderInstanceDetails(row) {
    if (this.props.runtimeInfoErr) {
      return null;
    }
    let data;
    if(row.instances) {
      data = Object.keys(row.instances).map(i => <tr key={i}><td>{i}</td><td>{row.instances[i]}</td></tr>);
    }

    return (
      <table className="table">
        <thead>
          <tr>
            <th>{t("Cluster")}</th>
            <th>{t("Instances")}</th>
          </tr>
        </thead>
        <tbody>
          {data}
        </tbody>
      </table>
    );
  }

  renderInstances(row) {
    if (this.props.runtimeInfoErr) {
      return null;
    }
    let totalCount = 0;
    if(row.instances !== undefined) {
      for (let clusterCount of Object.values(row.instances)) {
        totalCount += Number(clusterCount) || 0;
      }
    } else {
      return <i className="fa fa-circle-o-notch fa-spin fa-1-5x" title={t("Waiting for update ...")}/>;
    }

    return totalCount === 0 ? '-' :
      <span>{totalCount}&nbsp;&nbsp;
        <ModalLink
          target="instance-details-popup"
          title={t("View cluster summary")}
          icon="fa-external-link"
          item={row}
          onClick={(row) => {
            this.setState({
              instancePopupContent: {
                name: row.name,
                content: this.renderInstanceDetails(row)
              }
            });
          }}
        />
      </span>;
  }

  render() {
    let runtimeColumns = [];
    if (this.props.runtimeInfoEnabled) {
      runtimeColumns.push(
        <Column
          columnKey="runtime"
          header={t('Runtime')}
          cell={ (row) => this.renderRuntimeIcon(row) }
        />
      );
      runtimeColumns.push(
        <Column
          columnKey="instances"
          header={t('Instances')}
          comparator={Utils.sortByNumber}
          cell={ (row) => this.renderInstances(row) }
        />
      );
    }

    return (<div>
      <Table
        data={this.props.data}
        identifier={img => img.id}
        initialSortColumnKey="modified"
        initialSortDirection={-1}
        initialItemsPerPage={userPrefPageSize}
        searchField={
          <SearchField filter={this.searchData} criteria={""} />
        }
        selectable
        selectedItems={this.state.selectedItems}
        onSelect={this.handleSelectItems}>
        <Column
          columnKey="name"
          comparator={Utils.sortByText}
          header={t('Name')}
          cell={ (row) => row.name }
        />
        <Column
          columnKey="version"
          header={t('Version')}
          comparator={Utils.sortByText}
          cell={ (row) => row.version }
        />
        <Column
          columnKey="revision"
          header={t('Revision')}
          comparator={Utils.sortByNumber}
          cell={ (row) => row.revision > 0 ? row.revision : '-' }
        />
        <Column
          columnKey="updates"
          header={t('Updates')}
          cell={ (row) => this.renderUpdatesIcon(row) }
        />
        <Column
          columnKey="patches"
          header={t('Patches')}
          comparator={(a, b, ck, sd) => Utils.sortByNumber(
            {patches: a.patches.critical + a.patches.noncritical},
            {patches: b.patches.critical + b.patches.noncritical},
            ck, sd)}
          cell={ (row) => row.patches ? row.patches.critical + row.patches.noncritical : '-' }
        />
        <Column
          columnKey="packages"
          header={t('Packages')}
          comparator={Utils.sortByNumber}
          cell={ (row) => row.patches ? row.packages : '-' }
        />
        <Column
          columnKey="status"
          header={t('Build')}
          cell={ (row) => this.renderStatusIcon(row) }
        />
        { runtimeColumns }
        <Column
          columnKey="modified"
          header={t('Last Modified')}
          comparator={Utils.sortByDate}
          cell={ (row) => <DateTime time={row.modified}/> }
        />
        <Column
          width="10%"
          columnClass="text-right"
          headerClass="text-right"
          header={t('Actions')}
          cell={ (row) => {
            return (<div className="btn-group">
              <Button
                className="btn-default btn-sm"
                title={t("Details")}
                icon="fa-list"
                handler={() => {this.props.onSelect(row)}}
              />
              { isAdmin &&
                  <ModalButton
                    className="btn-default btn-sm"
                    title={t("Delete")}
                    icon="fa-trash"
                    target="delete-modal"
                    item={row}
                    onClick={this.selectImage}
                  />
              }
            </div>
            )}}
        />
      </Table>
      <DeleteDialog id="delete-modal"
        title={t("Delete Image")}
        content={<span>{t("Are you sure you want to delete image")} <strong>{this.state.selected ? (this.state.selected.name + " (" + this.state.selected.version + ")") : ''}</strong>?</span>}
        item={this.state.selected}
        onConfirm={(item) => this.props.onDelete([item.id])}
        onClosePopUp={() => this.selectImage(undefined)}
      />
      <DeleteDialog id="delete-selected-modal"
        title={t("Delete Selected Image(s)")}
        content={
          <span>
            {this.state.selectedItems.length == 1 ? t("Are you sure you want to delete the selected image?") : t("Are you sure you want to delete selected images? ({0} images selected)", this.state.selectedItems.length)}
          </span>
        }
        onConfirm={() => this.props.onDelete(this.state.selectedItems)}
      />
      <PopUp
        id="instance-details-popup"
        title={t("Instance Details for '{0}'", this.state.instancePopupContent.name)}
        content={this.state.instancePopupContent.content}
      />
    </div>
    );
  }
}

class ImageViewDetails extends React.Component {

  constructor(props) {
    super(props);
    ['onTabChange'].forEach(method => this[method] = this[method].bind(this));
  }

  getHashUrls(tabs) {
    const id = this.props.data.id;
    return tabs.map((t) => '#/' + t + '/' + id);
  }

  onTabChange(hash) {
    history.pushState(null, null, hash);
    if(this.props.onTabChange) {
      this.props.onTabChange(hash);
    }
  }

  render() {
    const data = this.props.data;

    return (
      <div>
        <TabContainer
          labels={[t('Overview'), t('Patches'), t('Packages'),
            this.props.runtimeInfoEnabled ? t('Runtime') : null]}
          hashes={this.getHashUrls(['overview', 'patches', 'packages', 'runtime'])}
          initialActiveTabHash={window.location.hash}
          onTabHashChange={this.onTabChange}
          tabs={[
            <ImageViewOverview key="1" data={data} onBuild={this.props.onBuild} onInspect={this.props.onInspect}
              runtimeInfoEnabled={this.props.runtimeInfoEnabled} runtimeInfoErr={this.props.runtimeInfoErr} onDelete={this.props.onDelete} />,
            <ImageViewPatches key="2" data={data}/>,
            <ImageViewPackages key="3" data={data}/>,
            this.props.runtimeInfoEnabled ? <ImageViewRuntime key="4" data={data}/> : null
          ]}
        />
        <Button
          text={t("Back")}
          icon="fa-chevron-left"
          title={t("Back")}
          className="btn-default"
          handler={this.props.onCancel}
        />
      </div>
    );
  }
}

ReactDOM.render(
  <ImageView runtimeInfoEnabled={isRuntimeInfoEnabled}/>,
  document.getElementById('image-view')
)