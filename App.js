// IMPORTANT NOTE: If you rebuild this app, you must add "var app;" to the new 
// deploy/App...html files just above "Rally.onReady(function () {"
//
Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',
    comboboxConfig: {
        fieldLabel: 'Select a PSI:',
//        labelWidth: 100,
        width: 500
    },
	addContent: function() {
	console.log("in content");
		this._showMask("Loading Data");
		this._createEquationPanel();
		this._loadFeatures();
	},
	onScopeChange: function() {
		console.log("in change");
		this._showMask("Refreshing Data");
		this._createEquationPanel();
		this._loadFeatures();
	},
	html: '<div align="right"><input type="button" value="Refresh" onClick="javascript: app._loadFeatures();"/> &nbsp;',
	_createEquationPanel: function () {
		if (!this._equationPanel) {
			this._equationPanel = Ext.create('Ext.Panel', {
				bodyPadding  : 5,
				border: 0,
				html: '<div "font-family:arial,helvetica,sans-serif;font-size:12px;font-color:black" align="center">' + '<br>' +
				'<table bgcolor="#F6F6F6" border="2" style="font-color:black;">' +
				'<tr><td><table border="0">' +
				'<tr><td title="Weighted Shortest Job First" rowspan="3" style="padding: 10px">WSJF =</td>' +
				'<td title="Time Value - Relative value of delivering the Feature sooner on the timeline" style="vertical-align: bottom;padding: 0 3px 0 10px;">Time Value + </td>' +
				'<td title="RR|OE Value - Relative value of risk reduction or potential business opportunity enablement" style="vertical-align: bottom;padding: 0 3px 0 0;">RR|OE Value + </td>' +
				'<td title="User/Business Value - Relative value to the end users or business" style="vertical-align: bottom;padding: 0 10px 0 0;">User/Business Value </td>' +
				'</tr><tr>' +
				'<td colspan="3" style="height: 2px; vertical-align: middle; padding: 0 10px 0 10px;"><hr noshade></td>' +
				'</tr><tr>' +
				'<td colspan="3" title="Job Size - Time needed to implement the Feature" style="text-align: center;vertical-align: top;">Job Size</td>' +
				'</tr></table></td>' +
				'<td style="text-align: center;padding:0 10px 0 10px;">' +
				'<p>Scale for each Value should follow: 1, 2, 3, 5, 8, 13, 21</p>' +
				'<p>Highest WSJF Score = Highest Priority</p></td></tr></table></div>'
			});
		}
	},
    _loadFeatures: function() {
     console.log("loading store");
        Ext.create("Rally.data.WsapiDataStore", {
            model: "PortfolioItem/Feature",
            autoLoad: true,
            filters: [this.getContext().getTimeboxScope().getQueryFilter()],
            remoteSort: false,
            listeners: {
                load: function(store, records, success) {
                    this._calculateScore(records), this._updateGrid(store);
                },
                update: function(store, rec, modified, opts) {
                    //console.log("calling store update");
                    this._calculateScore([rec]);
                },
                scope: this
            },
            fetch: ["DragAndDropRank", "Rank", "Name", "FormattedID", "Release", "TimeCriticality", "RROEValue", "UserBusinessValue", "ValueScore", "JobSize"]
        });
    },
    _calculateScore: function(records) {
        Ext.Array.each(records, function(feature) {
            console.log("feature", feature.data);
            var jobSize = feature.data.JobSize;
            var timeValue = feature.data.TimeCriticality;
            var OERR = feature.data.RROEValue;
            var userValue = feature.data.UserBusinessValue;
            var oldScore = feature.data.ValueScore;
            console.log( "Old Score ", oldScore);
            if (jobSize > 0) { // jobSize is the denominator so make sure it's not 0
                var score = Math.floor(((userValue + timeValue + OERR ) / jobSize) + 0.5);
                console.log("newscore: ", score);
                if (oldScore !== score) { // only update if score changed
                    feature.set('ValueScore', score); // set score value in db
//                    feature.save();
                    console.log("Setting a new score", score);
                }
            }
        });
    },
	_showMask: function(msg) {
		if ( this.getEl() ) { 
			this.getEl().unmask();
			this.getEl().mask(msg);
		}
	},
	_hideMask: function() {
		this.getEl().unmask();
	},

    _createGrid: function(myStore) {
		if ( this._myGrid ) { this._myGrid.destroy(); }
        this._myGrid = Ext.create("Rally.ui.grid.Grid", {
            xtype: "rallygrid",
            model: 'PortfolioItem/Feature',
            title: "Feature Scoring Grid",
            height: "98%",
            width: "98%",
            enableRanking: true,
            draggable: true,
//			showRowActionsColumn: true,
//			showRankColumn: true,
            store: myStore,
//            selType: "cellmodel",
            columnCfgs: [
				{
					dataIndex: "DragAndDropRank",
					maxWidth: 50
				},
                {
                    text: "Feature ID",
                    dataIndex: "FormattedID",
                    flex: 1,
                    maxWidth: 100,
                    xtype: "templatecolumn",
                    tpl: Ext.create("Rally.ui.renderer.template.FormattedIDTemplate")
                }, 
                {
                    text: "Name",
                    dataIndex: "Name",
                    editor: null
                }, 
                {
                    text: "Time Value",
                    dataIndex: "TimeCriticality",
                    maxWidth: 100,
                    flex: 2
                }, 
                {
                    text: "RR|OE Value",
                    dataIndex: "RROEValue",
                    maxWidth: 100,
                    flex: 2
                }, 
                {
                    text: "User Value",
                    dataIndex: "UserBusinessValue",
                    maxWidth: 100,
                    flex: 2
                }, 
                {
                    text: "Job Size",
                    dataIndex: "JobSize",
                    maxWidth: 100,
                    flex: 2
                }, 
                {
                    text: "Score",
                    dataIndex: "ValueScore",
                    maxWidth: 100,
                    editor: null
                }
            ]
        }), 
        this._hideMask();
        this.add(this._equationPanel);
        this.add(this._myGrid);
        app = this;
    },
    _updateGrid: function(myStore) {
        if (this._myGrid === undefined) {
            this._createGrid(myStore);
        }
        else {
            console.log("Refreshing Grid");
            this._myGrid.reconfigure(myStore);
            this._hideMask();
        }
    }
});
