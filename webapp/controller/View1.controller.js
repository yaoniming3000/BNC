sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/core/Fragment',
	'sap/m/MessageToast',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/m/SearchField',
	'sap/ui/model/type/String',
	'sap/m/ColumnListItem',
	'sap/m/Label',
	"sap/m/MessageBox",
	'sap/ui/core/BusyIndicator'
], function (Controller, Fragment, MessageToast, Filter, FilterOperator, SearchField, TypeString, ColumnListItem, Label, MessageBox,
	BusyIndicator) {
	"use strict";

	return Controller.extend("BNC.bnetDealerCreate.controller.View1", {
		onInit: function () {
			this._initForm();
		},

		_initForm: function () {
			var oModel = this.getOwnerComponent().getModel();
			oModel.resetChanges();
			var that = this;
			var mParam = {
				success: function (odata, resp) {
					that.getView().bindElement("/FormHeaderSet('0000000000')"); //id = 0 stands for a new form
					that.oHeaderOld = that.getView().getBindingContext().getObject();
				},
				error: function (oError) {}
			};
			oModel.read("/FormHeaderSet('0000000000')", mParam);
			this.getView().byId("inDealer").setValue("");
			this.getView().byId("feBnetType").getAggregation("_label").setRequired(true);
			this.getView().byId("fePrice").getAggregation("_label").setRequired(true);
			this.getView().byId("feCreate").getAggregation("_label").setRequired(true);
		},

		onDealerF4: function () {
			
			var oView = this.getView();

			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "BNC.bnetDealerCreate.view.DealerSearch",
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}
			this._pValueHelpDialog.then(function (oValueHelpDialog) {
				this._configValueHelpDialog(oValueHelpDialog);
				oValueHelpDialog.open();
			}.bind(this));

		},

		_configValueHelpDialog: function (dealerDialog) {
			//	dealerDialog.getAggregation("_dialog").getSubHeader().getContentMiddle()[0].setPlaceholder("Enter dealer ID or name...");
			dealerDialog.setContentWidth("800px");
			dealerDialog.setContentHeight("600px");
		},

		handleSearch: function (oEvent) {
			var sValue = this.byId("inDealerDetail").getValue();
			var sCountry = "";
			var selectCtr = this.byId("rdCountry").getSelectedIndex();
			switch (selectCtr) {
				case 0:
					sCountry = "AU";
					break;
				case 1:
					sCountry = "NZ";
					break;					
			}
			var oFilter = new Filter("Name1", FilterOperator.Contains, sValue);
			var oFilterCtr = new Filter("Country", FilterOperator.EQ, sCountry);
			var aFilter = [oFilter, oFilterCtr];
			var oBinding = this.byId("tbDealer").getBinding("items");
			oBinding.filter(aFilter);
		},

		handleValueHelpClose: function (oEvent) {
			// reset the filter
			var aContexts = this.byId("tbDealer").getSelectedContexts();
			if (aContexts && aContexts.length) {
				var dealerId = aContexts[0].getObject().Id;
				this.getView().byId("inDealer").setValue(dealerId);
				this.getView().byId("inDealer").fireChange();
				this.onDealerF4Close();
			} else {
				MessageToast.show("No dealer is selected");
			}
		},

		onDealerF4Close: function () {
			var oBinding = this.byId("tbDealer").getBinding("items");
			oBinding.filter([]);
			this.byId("tbDealer").removeSelections();

			this._pValueHelpDialog.then(function (oValueHelpDialog) {
				oValueHelpDialog.close();
			}.bind(this));
		},

		onDealerEnter: function (oEvent) {
			var dealerId = this.getView().byId("inDealer").getValue();
			var oModel = this.getView().getModel();
			var that = this;
			oModel.callFunction("/onDealerEnt", {
				method: "GET",
				urlParameters: {
					"DealerId": dealerId
				},
				success: function (resp) {
					// oModel.resetChanges();
					// var oContext = oModel.createEntry("/FormHeaderSet", resp);
					// that.getView().setBindingConetext(oContext);
					that.getView().bindElement("/FormHeaderSet('0000000000')");
					that.oHeaderOld = that.getView().getBindingContext().getObject();
				},
				error: function (oError) {
					var mError = JSON.parse(oError.responseText);
					MessageToast.show(mError.error.message.value);
				}
			});
		},

		onSave: function (oEvent) {
			var oModel = this.getView().getModel();
			var oHeader = this.getView().getBindingContext().getObject();
			if (oHeader.Status == "3") { //form is completed
				sap.m.MessageToast.show("Form has completed");
				return;
			}
			var sPath = "/FormHeaderSet('" + oHeader.Id + "')";
			var that = this;
			var mParam = {
				success: function (odata, resp) {
					sap.m.MessageToast.show("Form has been saved");
					if (oHeader.Id == 0) {
						sPath = "/FormHeaderSet('" + resp.data.Id + "')";
					}
					that._readForm(that, sPath);
				},
				error: function (oError) {
					var mError = JSON.parse(oError.responseText);
					sap.m.MessageToast.show(mError.error.message.value);
					that._readForm(that, sPath);
				}
			};
			oHeader.Action = "SAVE";
			if (oHeader.Id == 0) {
				oModel.create("/FormHeaderSet", oHeader, mParam);
			} else {
				oModel.update(sPath, oHeader, mParam);
			}
		},

		onSubmit: function (oEvent) {
			var oModel = this.getView().getModel();
			var oHeader = this.getView().getBindingContext().getObject();
			if (oHeader.Status == "3") { //form is completed
				sap.m.MessageToast.show("Form has completed");
				return;
			}
			var sPath = "/FormHeaderSet('" + oHeader.Id + "')";
			var that = this;
			var mParam = {
				success: function (odata, resp) {
					sap.m.MessageToast.show("Process has been finished");
					if (oHeader.Id == 0) {
						sPath = "/FormHeaderSet('" + resp.data.Id + "')";
					}
					that._readForm(that, sPath);
					BusyIndicator.hide();
				},
				error: function (oError) {
					var mError = JSON.parse(oError.responseText);
					sap.m.MessageToast.show(mError.error.message.value);
					that._readForm(that, sPath);
					BusyIndicator.hide();
				}
			};
			oHeader.Action = "SUBMIT";
			BusyIndicator.show();
			if (oHeader.Id == 0) {
				oModel.create("/FormHeaderSet", oHeader, mParam);
			} else {
				oModel.update(sPath, oHeader, mParam);
			}
		},

		onValueHelpRequested: function () {
			var oView = this.getView();
			var that = this;
			if (this._pValueHelpDialogForm) {
				this.formF4Dialog.destroy();
				this._pValueHelpDialogForm = null;
			}
			if (!this._pValueHelpDialogForm) {
				this._pValueHelpDialogForm = Fragment.load({
					id: oView.getId(),
					name: "BNC.bnetDealerCreate.view.FormValueHelp",
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}
			this._pValueHelpDialogForm.then(function (oValueHelpDialog) {
				this._configFormHelpDialog(oValueHelpDialog);
				that.formF4Dialog = oValueHelpDialog;
				oValueHelpDialog.open();
			}.bind(this));
		},

		_configFormHelpDialog: function (oDialog) {
			oDialog.getAggregation("_dialog").getSubHeader().getContentMiddle()[0].setPlaceholder("Enter form ID, status or dealer name...");
			oDialog.setContentWidth("900px");
			oDialog.setContentHeight("600px");
		},

		handleSearchForm: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("Id", FilterOperator.EQ, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},

		handleValueHelpCloseForm: function (oEvent) {
			// reset the filter
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);
			var that = this;
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var bChanged = this._hasHeaderChange();
				var mFormHeader = aContexts[0].getObject();
				var sPath = "/FormHeaderSet('" + mFormHeader.Id + "')";
				if (bChanged) {
					var msg = "Unsaved changes will be lost. Do you want to proceed?";
					MessageBox.warning(msg, {
						title: "Confirm",
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						emphasizedAction: MessageBox.Action.NO,
						onClose: function (sAction) {
							if (sAction === sap.m.MessageBox.Action.YES) {
								that.getView().getModel().resetChanges();
								that._readForm(that, sPath);
							} else {
								return;
							}
						}
					});
				} else {
					that.getView().getModel().resetChanges();
					that._readForm(that, sPath);
				}

			}
		},

		_readForm: function (that, sPath) {
			var mParam = {
				success: function (odata, resp) {
					that.getView().bindElement(sPath);
					that.oHeaderOld = that.getView().getBindingContext().getObject();
					that.getView().byId("inDealer").setValue(parseInt(that.oHeaderOld.DealerId, 10));
				},
				error: function (oError) {
					var mError = JSON.parse(oError.responseText);
					MessageToast.show(mError.error.message.value);
				}
			};
			that.getView().getModel().read(sPath, mParam);
		},

		onNewForm: function () {
			var that = this;
			if (this._hasHeaderChange()) {
				var msg = "Unsaved changes will be lost. Do you want to proceed?";
				MessageBox.warning(msg, {
					title: "Confirm",
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					emphasizedAction: MessageBox.Action.NO,
					onClose: function (sAction) {
						if (sAction === sap.m.MessageBox.Action.YES) {
							that.getView().getModel().resetChanges();
							that._initForm();
							MessageToast.show("New form loaded");
						} else {
							return;
						}
					}
				});
			} else {
				that.getView().getModel().resetChanges();
				that._initForm();
				MessageToast.show("New form loaded");
			}
		},

		_hasHeaderChange: function () {
			var oHeader = this.getView().getBindingContext().getObject();
			oHeader.__metadata = null;
			this.oHeaderOld.__metadata = null;
			if (oHeader.Status === "3") { //form is completed
				return false;
			}
			if (JSON.stringify(oHeader) === JSON.stringify(this.oHeaderOld)) {
				return false;
			} else {
				return true;
			}
		},

		onDelete: function () {
			var msg = "Form will be marked as deleted. Do you want to proceed?";
			var that = this;
			var oModel = this.getView().getModel();
			var oHeader = this.getView().getBindingContext().getObject();
			var sPath = "/FormHeaderSet('" + oHeader.Id + "')";
			var mParam = {
				success: function (odata, resp) {
					oModel.resetChanges();
					that._initForm();
					sap.m.MessageToast.show("Form " + oHeader.Id + " has been deleted");
					BusyIndicator.hide();
				},
				error: function (oError) {
					var mError = JSON.parse(oError.responseText);
					sap.m.MessageToast.show(mError.error.message.value);
					BusyIndicator.hide();
				}
			};

			MessageBox.warning(msg, {
				title: "Confirm",
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				emphasizedAction: MessageBox.Action.NO,
				onClose: function (sAction) {
					if (sAction === sap.m.MessageBox.Action.YES) {
						BusyIndicator.show();
						oModel.remove(sPath, mParam);
					} else {
						return;
					}
				}
			});
		}
	});
});