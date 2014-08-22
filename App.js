// IMPORTANT NOTE: If you rebuild this app, you must add "var app;" to the new 
// deploy/App...html files just above "Rally.onReady(function () {"
//
Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',
    comboboxConfig: {
        fieldLabel: '<div align="right"><input type="button" value="Refresh" onClick="javascript: this._loadFeatures();"/> &nbsp;&nbsp;&nbsp;&nbsp;Select a PSI:</div>',
        labelWidth: 200,
        width: 500
    },
	addContent: function() {
	console.log("in content");
		this._showMask("Loading Data");
		this._loadFeatures();
	},
	onScopeChange: function() {
		console.log("in change");
		this._showMask("Refreshing Data");
		this._loadFeatures();
	},
html: '<div align="right"><input type="button" value="Refresh" onClick="javascript: app._loadFeatures();"/> &nbsp;' +
		'<div "font-family:arial,helvetica,sans-serif;font-size:12px;font-color:black" align="center">' +
		'<table bgcolor="lightgray" border="2" style="font-color:black;">' +
		'<tr><td><table border="0">' +
		'<tr><td title="Weighted Shortest Job First" rowspan="3" style="padding: 10px">WSJF =</td>' +
		'<td title="User Value - Relative business value of the Feature" style="vertical-align: bottom;padding: 0 3px 0 10px;">User Value + </td>' +
		'<td title="Time Value - This measure deals with the NEED of delivering something in a timescale." style="vertical-align: bottom;padding: 0 3px 0 0;">Time Value + </td>' +
		'<td title="RR|OE Value - Relative value for the need of a business to eliminate risks earlier or the potential for new business opportunity to be derived from the Feature" style="vertical-align: bottom;padding: 0 10px 0 0;">RR|OE Value</td>' +
		'</tr><tr>' +
		'<td colspan="3" style="height: 2px; vertical-align: middle; padding: 0 10px 0 10px;"><hr noshade></td>' +
		'</tr><tr>' +
		'<td colspan="3" title="Job Size - Time needed to implement the Feature" style="text-align: center;vertical-align: top;">Job Size</td>' +
		'</tr></table></td>' +
		'<td style="text-align: center;padding:0 10px 0 10px;">' +
		'<p>Scale for each Value should follow: 1, 2, 3, 5, 8, 13, 21</p>' +
		'<p>Highest WSJF Score = Highest Priority</p></td></tr></table></div>',

    _loadFeatures: function() {
//		this.down('#header').add({'<h1>test from add</h1>'});
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
                    feature.save();
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
            enableRanking: true,
//            draggable: true,
//			showRowActionsColumn: true,
// PRIVATE NOW			showRankColumn: true,
            store: myStore,
            selType: "cellmodel",
            columnCfgs: [
				{
					dataIndex: "DragAndDropRank",
					maxWidth: 50
				},
                {
                    text: "Portfolio ID",
                    dataIndex: "FormattedID",
                    flex: 1,
                    xtype: "templatecolumn",
                    tpl: Ext.create("Rally.ui.renderer.template.FormattedIDTemplate")
                }, 
                {
                    text: "Name",
                    dataIndex: "Name",
                    flex: 2
                }, 
                "TimeCriticality", "RROEValue", "UserBusinessValue", "JobSize", 
                {
                    text: "Score",
                    dataIndex: "ValueScore",
                    editor: null
                }
            ]
        }), 
        this._hideMask();
        this.add(this._myGrid);
        app = this;
        // override the event publish to prevent random refreshes of the whole app when the cell changes
        var celledit = this._myGrid.plugins[0];
        var oldPub = celledit.publish;
        var newPub = function(event, varargs) {
            if (event !== "objectupdate") {
                oldPub.apply(this, arguments);
            }
            else {
                // no-op
            }
        };

        celledit.publish = Ext.bind(newPub, celledit);
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
    },
	_displayDetails: function() {
		
	}

});
