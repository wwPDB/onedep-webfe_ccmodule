/***********************************************************************************************************
File:		cc-main.js
Author:		rsala (rsala@rcsb.rutgers.edu)
Date:		2010-10-01
Version:	0.0.1

JavaScript supporting Ligand Module web interface 

2010-10-01, RPS: Created
2010-12-03, RPS: javascript in rcsb_inst_srch_launch_tmplt.html incorporated into this file.
2010-12-07, RPS: Introduced handlers on assignment actions to accommodate different states/modes of ligand ID 
					assignment (leveraging "commit_assgn" css class).
2010-12-10, RPS: Updates for accommodating atom-level mapping and force-assign functionality.
2010-12-16, RPS: Introduced support for rerunning chem comp searches with adjusted parameters
2010-12-22, RPS: Added required query params for call to "assignInstanceUrl". Fixed unqualified parameter text
 					boxes used for rerunning search for all instances.
2011-01-05, RPS: Now toggling display of "Show/Hide" for rerun search form button.
2011-01-10, RPS: Showing confirmations of parameter values used for "rerun search" behavior.
2011-01-13, RPS: Enabling/disabling of rerun search buttons as appropriate.
2011-01-19, RPS: Added functionality for capturing any new CC IDs defined via editor component.
				 Added functionality for validating any CC IDs to be used for Force Assignment.
2011-01-27, RPS: Updated to support use of help tool tips on Batch and Instance level page.
				 Corrected faulty handling of automatic enable/disable behavior of buttons in all-instance section.
2011-02-01, RPS: Consolidated redundant code by creating doAssign() and doUnAssign() functions
2011-02-03, RPS: Consolidated redundant code by creating enableCntrls() and disableCntrls() functions which support
					both contexts of "assign" mode vs. "validate" mode. More comprehensive validation strategy being employed.
2011-02-16, RPS: Updated with support for 3D viewing of ligand instances within environment of author's entire deposited structure.
2011-02-21, RPS: Batch Summary View and Instance Search View now reside on single html page. So consolidated js for 
					batch search screen and inst_srch_scrn.js into this single "ligmod.js" file.
2011-03-04, RPS: Added support for providing 3D environment view for author's chem components within same webpage as well as separate webpage
2011-03-21, RPS: Jmol viewing now with light gray background and carbons in black.
2011-03-25, RPS: Added support for
 					= viewing arbitrary non-candidate chem components in comparison panel
 					= reloading jmol viewer when atom map view is active
					= synchronizing scroll-bar movement for all atom-map lists viewed in comparison grid
2011-03-31, RPS: Fix for synchronizing scroll-bars in all instances view when adding item to comparison panel and there is already
 					item(s) present in comparison panel with atom-map already being viewed
2011-05-25, RPS: All references to "non-candidate" replaced with "new candidate"
					Added '#selectall' handler to allow user to select/de-select all instance IDs for inspection in instance search UI
2011-06-03, RPS: Corrected issue with launching Instance Search UI with selectall checkbox selected
					Improved behavior of selectall checkbox (automatically unchecked when any lig instance in table is unchecked)
2011-06-08, RPS: Correcting behavior for properly showing/hiding 2D display on addition of new components to compare grid.
					Updated for URLs to new standalone viewer interface for profiling chem component definitions already in dictionary.
2011-06-20, RPS: Displaying instance matching warning messages via BeautyTips
2011-06-23, RPS: service URL reorganization.
2011-07-01, RPS: updated handler for switching between Environment/Standalone views in comparison panel display
 				 to load ready-made html markup for "environment" and "stand-alone" views where necessary
2011-07-27, RPS: removed obsolete code for refreshing view of batch search assignment data (was hold-over mechanism from time when 
 				 batch-level and instance-level views were on separate web pages).
2011-09-15, RPS: updated to make use of "polling" strategy for availability of batch search results data 				 
2011-11-02, RPS: reverted to use of default color for carbon atoms in jmol views (gray), and removed background for atom labels.
2011-11-11, RPS: Some relative URL values updated to reflect consolidated deployment of all common tool front-end modules.
2011-12-08, RPS: Consolidation of redundant code and reorganization so that code for "global view" exists in separate 
				 cc-global-view.js file and code for "instance view now resides in separate cc-instance-view.js file.
2011-12-20, RPS: File name changed from "ligmod.js" to "cc-main.js" for consistency with supplementary "cc-global-view.js" and "cc-instance-view.js" files.
2011-12-22, RPS: More URL updates to reflect consolidated deployment of all common tool front-end modules.
2014-02-19, RPS: Jmol replaced with Jsmol which necessitated update in jQuery core and jQuery UI libraries, and forced upgrade of BeautyTips js plugin.
2014-11-19, RPS: Updated to use latest version of jsmol
2015-10-16, RPS: Updated to reference specific version of jsmol given problems with labelling seen with latest(via pointer)
*************************************************************************************************************/
var ajaxTimeout = 60000;
var SNGL_INSTNC = "SNGL_INSTNC"
var ALL_INSTNC = "ALL_INSTNC"
var adminContact = 'Send comments to: <a href="mailto:jwest@rcsb.rutgers.edu">help@wwpdb-dev.rutgers.edu</a>';
var infoStyle = '<span class="ui-icon ui-icon-info fltlft"></span> ';
var errStyle = '<span class="ui-icon ui-icon-alert fltlft"></span> ';
var genBatchSummaryRsltsURL = '/service/cc/assign/view/batch'
var checkForBatchDataURL = '/service/cc/assign/view/batch/data_check'
var loadBatchDataURL = '/service/cc/assign/view/batch/data_load'
var loadInstncSrchVwUrl = '/service/cc/assign/view/instance';
var assignInstanceUrl = '/service/cc/assign/assign_instance';
var rerunInstncSrchUrl = '/service/cc/assign/rerun_instnc_srch';
var rerunEntityGrpSrchUrl = '/service/cc/assign/rerun_entitygrp_srch';
//var reloadGlblSmmryUrl = '/service/cc/assign/view/batch/refresh';
var getNewCcIdUrl = '/service/cc/assign/view/instance/get_new_ccid';
var validateCcIdUrl = '/service/cc/assign/validate_ccid';
var getNewCandidateUrl = '/service/cc/assign/view/instance/get_new_candidate';
var exit_finished_URL = '/service/cc/assign/wf/exit_finished';
var exit_not_finished_URL = '/service/cc/assign/wf/exit_not_finished';
var activeCCid = 1;
var debUG = false;
var checked = false;
var allchecked = {};
var loadGlblSmmryFrmLctr = '#load_smmry_frm';
var JMOL_VRSN = 'jmol-latest';
$(document).ready(function() {	
	$(document).ajaxError(function(e, x, settings, exception) {
	    try {
	        if (x.status == 0) {
	            $('.errmsg.glblerr').html(errStyle + 'You are offline!!<br />Please Check Your Network.').show().fadeOut(4000);
	        } else if (x.status == 404) {
	            $('.errmsg.glblerr').html(errStyle + 'Requested URL "' + settings.url + '" not found.<br />').show().fadeOut(4000);
	        } else if (x.status == 500) {
	            $('.errmsg.glblerr').html(errStyle + 'Internel Server Error.<br />').show().fadeOut(4000);
	        } else if (e == 'parsererror') {
	            $('.errmsg.glblerr').html(errStyle + 'Error.\nParsing JSON Request failed.<br />').show().fadeOut(4000);
	        } else if (e == 'timeout') {
	            $('.errmsg.glblerr').html(errStyle + 'Request Time out.<br />').show().fadeOut(4000);
	        } else {
	            $('.errmsg.glblerr').html(errStyle + x.status + ' : ' + exception + '<br />\n').show().fadeOut(4000);
	        }
	    } catch (err) {
			$('.loading').hide();
	        var errtxt = 'There was an error while processing your request.\n';
	        errtxt += 'Error description: ' + err.description + '\n';
	        errtxt += 'Click OK to continue.\n';
	        alert(errtxt);
	    }
	});
	$.ajax({url: '/ccmodule/js/jquery/ui-src/jquery-ui-1.10.3.custom.min.js', async: true, dataType: 'script'});
	$.ajax({url: '/js/jquery/plugins/jquery.form.min.js', async: true, dataType: 'script'});
	$.ajax({url: '/ccmodule/js/jquery/plugins/jquery.paginate.my.js', async: true, dataType: 'script'});
	$.ajax({url: '/js/jquery/plugins-src/jquery.bt.v097.min.js', async: true, dataType: 'script'});
	$.ajax({url: '/applets/'+JMOL_VRSN+'/jsmol/JSmol.min.nojq.js', async: true, dataType: 'script'});
	$.ajax({url: '/ccmodule/js/cc-global-view.js', async: true, dataType: 'script'});
	$.ajax({url: '/ccmodule/js/cc-instance-view.js', async: true, dataType: 'script'});
	$('#help_batch_smmry_vw').bt({positions: ['left', 'bottom'],ajaxPath: '/ccmodule/cc_help.html div#summary',ajaxOpts:{dataType:'html'},trigger: 'click',
		width: 600,centerPointX: .9,spikeLength: 20,spikeGirth: 10,padding: 15,cornerRadius: 25,fill: '#FFF',
		strokeStyle: '#ABABAB',strokeWidth: 1});
	$('#help_cmpst_scr').bt({positions: ['left', 'bottom'],ajaxPath: '/ccmodule/cc_help.html div#cmpst_score',ajaxOpts:{dataType:'html'},trigger: 'click',
		width: 600,centerPointX: .9,spikeLength: 20,spikeGirth: 10,padding: 15,cornerRadius: 25,fill: '#FFF',
		strokeStyle: '#ABABAB',strokeWidth: 1});
});	
