/**************************************************************************************************************
File:		cc-global-view.js
Author:		rsala (rsala@rcsb.rutgers.edu)

JavaScript supporting Ligand Module web interface 

2011-12-08, RPS: This file created to house code for managing "global view" and which originally from ligmod.js
2013-04-08, RPS: closeWindow() method only appropriate in "workflow" context, so removed method calls from blocks used for "standalone" context
2014-02-19, RPS: Updates per upgrades to jQuery core  1.10.2 and jQuery UI 1.10.3.
2014-07-11, RPS: browser tab / document.title no longer being set here. Instead displaying module abbreviation, pdbID, and entryID as encoded in html template.
2014-09-23, RPS: Optimized use of AJAX calls when checking for availability of summary data, when loading summary data, and when loading instance browser view.
2014-11-17, RPS: Addressed bug with #selectall "click" handler.
2014-11-19, RPS: "startsWith" function definition modified to allow use of latest version of jsmol
2017-04-11, RPS: Updates to accommodate identification of ligands selected by depositor as "ligands of interest"
****************************************************************************************************************/
///////////////////// FUNCTION DEFINITIONS - Global Batch Search Summary View ///////////////////////////////////////////

var progressWaiting=false;

function progressStart() {
    if (!progressWaiting) {
        $("#progress-dialog").fadeIn('slow').spin("large", "black");
        progressWaiting=true;
    }
}

function progressEnd() {
    $("#progress-dialog").fadeOut('fast').spin(false);
    progressWaiting=false;
}

function applyBeautyTips() {
	$('.cmpst_scr').bt({positions: ['left', 'bottom'],ajaxPath: '/ccmodule/cc_help.html div#cmpst_score',ajaxOpts:{dataType:'html'},trigger: 'hover',
		width: 600,centerPointX: .9,spikeLength: 20,spikeGirth: 10,padding: 15,cornerRadius: 25,fill: '#FFF',
		strokeStyle: '#ABABAB',strokeWidth: 1});
	$('.match_status').bt({positions: ['left', 'bottom'],ajaxPath: '/ccmodule/cc_help.html div#match_status',ajaxOpts:{dataType:'html'},trigger: 'hover',
		width: 600,centerPointX: .9,spikeLength: 20,spikeGirth: 10,padding: 15,cornerRadius: 25,fill: '#FFF',
		strokeStyle: '#ABABAB',strokeWidth: 1});
	$('.warninfo [title]').bt({positions: ['most'],width: 300,centerPointX: .8,spikeLength: 10,spikeGirth: 15,padding: '15px',cornerRadius: 25,fill: '#FFF',
		strokeStyle: '#ABABAB',strokeWidth: 1,cssStyles: {fontSize: '85%'}});
	$('#loi').bt({positions: ['most'],fill: '#FFF',	strokeStyle: '#ABABAB', cssStyles: {fontSize: '85%'}});
}
function closeWindow() {
    //uncomment to open a new window and close this parent window without warning
    //var newwin=window.open("popUp.htm",'popup','');
    if(navigator.appName=="Microsoft Internet Explorer"){
        this.focus();self.opener = this;self.close(); 
    } else {
            window.open('','_parent',''); window.close(); 
    }
}
function unassignedInstncsHandler() {
	var numToAssign = 0;
   	$('#rslts td.assgnmnt_status').each( function() {
		var assgnstatus = $(this).html();
		if( assgnstatus == 'Not Assigned'){
			numToAssign = numToAssign + 1;
			$(this).removeClass('beenassigned');
		}
		else{
			if( assgnstatus != 'NA' ){
				$(this).addClass('beenassigned');
			}
		}
	});
   	if( numToAssign == 0 ){
   		$("#savedone").removeAttr('disabled');
   	}
   	else if ( numToAssign > 0 ){
   		$("#savedone").attr('disabled','disabled');
   	}
   	return numToAssign;
}
String.prototype.startsWith = function (str){
	return this.indexOf(str) == 0;
};

function getCcBatchRslts() {
	$(loadGlblSmmryFrmLctr).ajaxSubmit({url: genBatchSummaryRsltsURL, async: true, clearForm: false,
        success: function(jsonOBJ) {
			checkSummaryStatus(jsonOBJ.semaphore);
        }
    });
    return false;
}
function checkSummaryStatus(semaphore) {
	try {
		
		doCheck(semaphore);		
		
	} catch(err) {
		$('.errmsg').html(errStyle + 'Error on checking for batch data.<br />\n' + adminContact).show().delay(5000).slideUp(800);
	}
}

function doCheck(semaphore) {
	
    $.ajax({type: 'GET',url: checkForBatchDataURL, async: true,data: {'semaphore': semaphore,'sessionid': sessionID,'delay': 3},
		success: function(resOBJ) {
			var procStatus = resOBJ.statuscode;
			if( procStatus == 'completed'){
				try{
					$(loadGlblSmmryFrmLctr).ajaxSubmit({url: loadBatchDataURL, async: true, clearForm: false,
			            target: '#rslts',
			        	success: function() {
							$("#saveunfinished").removeAttr('disabled');
			            	$(".instance_search_ui").removeAttr('disabled');
			            	$("#reload").removeAttr('disabled');
			            	unassignedInstncsHandler();
			            	applyBeautyTips();
						}
					});
					return false;
					
				}catch(err){
					$('.errmsg').html(errStyle + 'Failed to load your batch data.' + '<br />\n' + adminContact).show();
				}
			}else if( procStatus == 'running' ){
				doCheck(semaphore);
			}
			else if( procStatus == 'failed' ){
				$('.errmsg').html(errStyle + 'Failed to load your batch data.' + '<br />\n' + adminContact).show();
			}
		}
	});
    
}

function loadSummaryData() {
	$(loadGlblSmmryFrmLctr).ajaxSubmit({url: loadBatchDataURL, async: true, clearForm: false,
		target: '#rslts',
		success: function() {
			$("#saveunfinished").removeAttr('disabled');
			$(".instance_search_ui").removeAttr('disabled');
			$("#reload").removeAttr('disabled');
			unassignedInstncsHandler();
			applyBeautyTips();
		},
		error: function() {
			$('.errmsg').html(errStyle + 'Failed to load ligand summary data.' + '<br />\n').show();
		}
	});
}

function loadInstanceSearchView() {
	activeCCid = 1;
	$('#batch_summary_vw').hide();
	$('#help_batch_smmry_vw').hide();
	$('#instnc_srch_vw').show();
	//alert('length of instnc section: '+$('#entity_browser_container').html().length);
	var listOfSrchIds = $('#srchids').val();
	var listOfSrchIdsForInstVw = $('#srchids_inst_vw').val();
	if( $('#entity_browser_container').html().length <= 150 || ( listOfSrchIdsForInstVw != listOfSrchIds ) ){
		$('#srchids_inst_vw').val(listOfSrchIds);
    	$('#inst_srch_frm').ajaxSubmit({url: loadInstncSrchVwUrl, async: true, 
		    type: 'post', clearForm: false,
            target: '#entity_browser_container',
            success: function() {
    			$('#help_instnc_srch_vw').bt({positions: ['left', 'bottom'],ajaxPath: '/ccmodule/cc_help.html div#instance',ajaxOpts:{dataType:'html'},trigger: 'click',
    				width: 600,centerPointX: .9,spikeLength: 20,spikeGirth: 10,padding: 15,cornerRadius: 25,fill: '#FFF',
    				strokeStyle: '#ABABAB',strokeWidth: 1});
    			$('#pagi').paginate({count: $('.tabscount').size(), start:activeCCid, display:6, border:true, border_color:'#BEF8B8',
    				text_color:'#68BA64', background_color:'#E3F2E1', border_hover_color:'#68BA64', text_hover_color:'black',
    				background_hover_color:'#CAE6C6', images:false, mouse:'press', onChange:function(page){
    					$('._current').removeClass('_current').slideUp('slow');
    					$('#p'+page).addClass('_current').slideDown('slow');
    					$('#p_'+page).addClass('_current').slideDown('slow');
    					$('#p__'+page).addClass('_current').slideDown('slow');
    					activeCCid = page;
    				}
    			});
    			$('.single_instance').hide();
    			//$( '#help' ).button();
    			var firstGrp = $('.cmpnt_grp:first').html();
    			$('.inneraccordion .head.'+firstGrp+'_hdr').each( function(index) {
    				if(index > 0){
    					var instnc_profile_html = $(this).next().attr('id');
    					var instnc_id = $(this).next().attr('name');
    					//alert("instnc_id is: "+instnc_id);
    					if(instnc_profile_html.length){
    						if( $('#'+instnc_id).html().length < 100 ){
    							//alert("About to load instnc profile.");
    							$('#'+instnc_id).load(instnc_profile_html);
    						}
    					}
    				}
    			});
    		    $('#restart').click(function() {
    		    	alert("[PLACEHOLDER] -- will perform restart action");
    		    });
    		    $('#backtobatchvw').removeAttr('disabled');
    		    $('#backtobatchvw').click(function() {
    		    	$("#instnc_srch_vw").hide();
    		    	$('#help_instnc_srch_vw').hide();
    		    	unassignedInstncsHandler();
    		    	$("#batch_summary_vw").show();
        			$("#help_batch_smmry_vw").show();
    		    });
    		    applyBeautyTips();
    			/*
    			$('#help').click(function() {
    		            alert("[PLACEHOLDER]");
    		    });
    		    */
            }
        });
        return false;
	}
}
///////////////////// END OF FUNCTION DEFINITIONS - Global Batch Search Summary View /////////////////////////////////////////

//////////////////// FUNCTION CALLS - Global Batch Search Summary View //////////////////////////////////////////////////////
loadSummaryData();
//////////////////// END OF FUNCTION CALLS - Global Batch Search Summary View ///////////////////////////////////////////////

//////////////////// EVENT HANDLERS - Global Batch Search Summary View //////////////////////////////////////////////////////
$('#savedone').click(function() {
	var numToAssign = 0;
	var fsrc = fileSource.toLowerCase();
	if( fsrc.startsWith("wf")){
		$('#hlprfrm').ajaxSubmit({url: exit_finished_URL, clearForm: false,
            beforeSubmit: function (formData, jqForm, options) {
                progressStart();
            	numToAssign = unassignedInstncsHandler();
        	    if( numToAssign > 0 ){
        	    	alert("Assignment status has changed for one or more ligand instances. Finish action being canceled. Please see updated status info on this page and check your work.");
        	    	return false;
        	    }
        	    formData.push({"name": "sessionid", "value": sessionID});
            }, success: function() {
                progressEnd();
			// alert("Work will be saved and Ligand Processing now complete.");
                closeWindow();
            }
        });
	}
	else{
   		numToAssign = unassignedInstncsHandler();
	    if( numToAssign > 0 ){
	    	alert("Assignment status has changed for one or more ligand instances. Finish action being canceled./nPlease see updated status info on this page and check your work.");
	    	return false;
	    }
    	// alert("Save (Done)");
		checkval=0;
    	$('html').html('')
	}
});
$('#saveunfinished').click(function() {
	var fsrc = fileSource.toLowerCase();
	if( fsrc.startsWith("wf")){
		$('#hlprfrm').ajaxSubmit({url: exit_not_finished_URL, clearForm: false,
            beforeSubmit: function (formData, jqForm, options) {
                progressStart();
                formData.push({"name": "sessionid", "value": sessionID});
            }, success: function() {
                progressEnd();
				// alert("Work will be saved and can be resumed at a later point.");
                closeWindow();
            }
        });
	}
	else{
    	// alert("Save (Unfinished)");
		checkval=0;
    	$('html').html('')
	}
});
$('.instance_search_ui').click(function() {
	var srchIds = '';
	var srchCount = 0;
    $('#batch_summary_vw :checkbox:checked:not(#selectall)').each(function() {
    	srchCount++;
    	srchIds += ((srchIds.length > 0) ? ',' : '') + $(this).attr('name');
		//alert("Value of 'name' #"+ srchCount + ": " + $(this).attr('name') );
    });
    $('#srchids').val(srchIds);
	//alert("Value of srchIds: " + srchIds);
	if( srchCount > 0 ){
		$('#help_instnc_srch_vw').show();
		loadInstanceSearchView();
	}
	else{
		alert("Please select at least one entry to submit to Instance Search.");
	}
});
$('#rerun_batch').click(function() {
        alert("[PLACEHOLDER]");
});
/*
$('#help').click(function() {
        alert("[PLACEHOLDER]");
});
*/
window.onbeforeunload = function(evt) {
	//if(checkval==1){
	if(false){
		return 'Your work is not saved! Are you sure you want to close this screen?';
	}
};
$(document).on('click','#selectall', function(){
	$(this).parents('div:eq(0)').find(':checkbox').prop('checked', this.checked);
});
$(document).on("click",".selectinstnc",function() {
	//alert('Captured click event');
	var checked = this.checked;
	if( !checked ){
		$('#selectall').prop('checked', this.checked);
	}
});
////////////////////END OF EVENT HANDLERS - Global Batch Search Summary View //////////////////////////////////////////////////////
