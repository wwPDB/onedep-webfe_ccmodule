/****************************************************************************************************************************
File:		cc-instance-view.js
Author:		rsala (rsala@rcsb.rutgers.edu)

JavaScript supporting Ligand Module web interface 

2011-12-08, RPS: This file created to house code for managing "instance level view" and which originally came from ligmod.js
2013-01-31, RPS: Added support for viewing of 2D images with augmented labeling.
2013-03-05, ZF:  Added support for assignment using chemical component file
2013-04-04: RPS: Fixed bug so that UI behaves as expected when All Instances section is used to establish 
					assignment just for *selected* instance IDs (i.e. and not entire group of ligands having same author assigned ID).
2013-04-17, ZF:  Added checking if assign CCID is in HitList
2013-11-04, ZF:  Added $('.instnc_actions .create_new_lig_go').live("click", function()) & $('.instnc_actions .chop_lig_go').live("click", function())
2014-02-19, RPS: Updated to replace Jmol with Jsmol (which involved update in jQuery core and jQuery UI libraries, and hence removal of ".live" binding syntax.
2014-05-05, RPS: Updated with feature to allow viewing of 2D rendition of SMILES string supplied by depositor
2014-11-19, RPS: Updated to use latest version of jsmol
2015-10-16, RPS: Updated to reference specific version of jsmol given problems with labelling seen with latest(via pointer)
*****************************************************************************************************************************/
////////////////////START: FUNCTION DEFINITIONS - Instance Search View //////////////////////////////////////////////////////	
jQuery.fn.synchronizeScroll = function() {
    var elements = this;
    if (elements.length <= 1) return;
 
    elements.scroll(
    function() {
        var top = $(this).scrollTop();
        elements.each(
        function() {
            if ($(this).scrollTop() != top) $(this).scrollTop(top);
        }
        );
    });
}
var jsmolAppOpen={};
var jsmolAppDict={};

function initJsmolApp(appName, id) {
	//alert("Beginning initJsmolApp");
    var xSize=300;
    var ySize=300;
    Jmol._binaryTypes = [".map",".omap",".gz",".jpg",".png",".zip",".jmol",".bin",".smol",".spartan",".mrc",".pse"];
    Info = {
        j2sPath: "/assets/applets/"+JMOL_VRSN+"/jsmol/j2s",
        serverURL: "/assets/applets/"+JMOL_VRSN+"/jsmol/php/jsmol.php",
        width:  xSize,
        height: ySize,
        debug: false,
        color: "0xD3D3D3",
        disableJ2SLoadMonitor: true,
        disableInitialConsole: true,
        addSelectionOptions: false,
        use: "HTML5",
        readyFunction: null,
        script: ""
    };
    Jmol.setDocument(0);
    jsmolAppDict[appName]=Jmol.getApplet(appName,Info);


    $('#'+id).html( Jmol.getAppletHtml(jsmolAppDict[appName]) );
    jsmolAppOpen[appName]=true;
    
    //alert("Reached end of initJsmolApp and html is: "+Jmol.getAppletHtml(jsmolAppDict[appName]));
}


function loadFileJsmol(appName, id, filePath, jmolMode) {
	//alert("in loadFileJsmol and filePath is: "+filePath);
	if( jsmolAppOpen[appName] ) {
		delete jsmolAppDict[appName];
		jsmolAppOpen[appName]=false;
    }
	initJsmolApp(appName,id);
	
    var setupCmds = '';
    if (jmolMode == 'wireframe') {
    	setupCmds = "background black; wireframe only; wireframe 0.05; labels off; slab 100; depth 40; slab on;";
    } else if (jmolMode == 'cpk') {
    	setupCmds = "background white; wireframe off; spacefill on; color chain; labels off; slab 100; depth 40; slab on";
    } else {
    	setupCmds = "labels off; set showHydrogens FALSE; background [xD3D3D3];";
    }
    var jmolCmds = "load " + filePath + "; " + setupCmds;
    Jmol.script(jsmolAppDict[appName], jmolCmds);
}

function getUniqueIdForJsmol(sInstId){
	return sInstId.split("_")[1]+sInstId.split("_")[2]+sInstId.split("_")[3];
}

function isAnnotation(fileSource) {
	var isAnnot = false;
	if (fileSource == 'wf-archive' ||
			fileSource == 'wf_archive' ||
			fileSource == 'wf-instance' ||
			fileSource == 'wf_instance' ||
			fileSource == '') {
				isAnnot = true;
			}

	return isAnnot;
}

function toggleChemCompDisplay(sInstId,sRefId,sCntxt,bShow){
	var id_1, id_2, jmolHtmlSuffix, atmMpHtmlSuffix;
	if( sCntxt == SNGL_INSTNC ){
		id_1 = sInstId;
		id_2 = sRefId;
		jmolHtmlSuffix = '_ref_jmol.html';
		atmMpHtmlSuffix = '_ref_atm_mp_li.html';
	}
	else if( sCntxt == ALL_INSTNC ){
		id_1 = sRefId;
		id_2 = sInstId;
		jmolHtmlSuffix = 'instnc_jmol_allInstVw.html';
		atmMpHtmlSuffix = 'instnc_atm_mp_li.html';
	}
	var ulElemLocator = ' #instance_data_' + id_1;
	var liElemUrl = sessPathPrefix + '/' + sInstId +'/'+id_2+'_viz_cmp_li.html';
	var liElemLocator = ' #vizcmp_' + id_1 + '_' + id_2;
	//alert('Length of '+liElemLocator+' is : '+$(liElemLocator).length );
	if( $(liElemLocator).length == 0){
		$.get(liElemUrl, function(data){
			$(ulElemLocator).append(data);
			var twoDchecked = $('#twoD_chck_bx_'+id_1).prop("checked");
			var threeDchecked = $('#threeD_chck_bx_'+id_1).prop("checked");
			var atmMpChecked = $('#atm_mp_chck_bx_'+id_1).prop("checked");
			var twoDdivElemLocator = liElemLocator + ' div.twoDviz';
			var threeDdivElemLocator = liElemLocator + ' div.threeDviz';
			var atmMpDivElemLocator = liElemLocator + ' div.atm_mp';
			var jmolHtmlUrl = sessPathPrefix + '/' + sInstId +'/'+id_2+jmolHtmlSuffix;
			var atmMpHtmlUrl = sessPathPrefix +'/'+sInstId+'/'+id_2+atmMpHtmlSuffix;
			$(twoDdivElemLocator).css('display', twoDchecked ? 'block' : 'none');
			
			if(threeDchecked){
				$(threeDdivElemLocator).each( function(n) {
					//instid = $(this).attr('name');
					
						var uniqeId = getUniqueIdForJsmol(sInstId);
						if( $(this).hasClass("ref") ){
							refCcId = $(this).attr('name');

							if (depId == 'TMP_ID' || isAnnotation(fileSource) == true) {
								loadFilePath = sessPathPrefix+'/rfrnc_reports/'+refCcId+'/'+refCcId+'_ideal.cif';
							} else {
								loadFilePath = '/service/cc_lite/report/file?identifier=' + depId + '&source=ccd&ligid=' + refCcId + '&file=' + refCcId + '_ideal.cif';
							}
							
							refThreeDdivId = 'threeD_'+sInstId+'_'+refCcId;
							
							//invoke jsmol for dictionary reference
							if( !($('#r'+uniqeId+refCcId+'_appletinfotablediv').length ) ) {
								if( $('#'+refThreeDdivId).length ){
									loadFileJsmol('r'+uniqeId+refCcId,refThreeDdivId,loadFilePath,"default");
									$('#r'+uniqeId+refCcId+'_appletinfotablediv').css({'padding-left':'0px', 'border-style':'none'});
									$('#r'+uniqeId+refCcId+'_appletdiv').css({'padding-left':'0px', 'border-style':'none'});
								}
							}
						}
						else if( $(this).hasClass("exp") ){
							authAssgndId = $(this).attr('name');

							if (depId == 'TMP_ID' || isAnnotation(fileSource) == true) {
								loadFilePath = sessPathPrefix+'/'+sInstId+'/report/'+authAssgndId+'_model.cif';
							} else {
								loadFilePath = '/service/cc_lite/report/file?identifier=' + depId + '&source=author&ligid=' + sInstId + '&file=' + authAssgndId + '_model.cif';
							}

							expThreeDdivId = 'threeD_'+sInstId;
							
							//invoke jsmol for experimental data
							if( !( $('#e'+uniqeId+'_appletinfotablediv').length ) ){
								loadFileJsmol("e"+uniqeId,expThreeDdivId,loadFilePath,"default");
								$('#e'+uniqeId+"_appletinfotablediv").css({'padding-left':'0px', 'border-style':'none'});
								$('#e'+uniqeId+"_appletdiv").css({'padding-left':'0px', 'border-style':'none'});
							}
						}
				});
				$(threeDdivElemLocator).css('display', 'block');
			}
			else{
				$(threeDdivElemLocator).css('display', 'none');
			}
			
			if( $(atmMpDivElemLocator).length < 100 ){
				$(atmMpDivElemLocator).load(atmMpHtmlUrl, function(){
					$(atmMpDivElemLocator).css('display', atmMpChecked ? 'block' : 'none');
					$('.atm_mp.'+sRefId).synchronizeScroll();
				});
			}
		}, "html");
	}
	$(liElemLocator).css('display', bShow ? 'block' : 'none');
}

function refreshImage(id, attr_tag){ 
        var source = $(id).attr(attr_tag);
        source = source.split("?", 1);
        d = new Date();
        $(id).attr(attr_tag, source + '?' + d.getTime());
}

function refreshInstImages(instId){
        var ulElemLocator = '#instance_data_' + instId;
        $(ulElemLocator + ' li').each( function() {
            var default_id = 'image_' + instId;
            var larger_id = 'twoD_labld_vw_no_hy_' + instId;
            if ($(this).hasClass('cc_ref')) {
                var id = $(this).attr('id');
                default_id = id.replace('vizcmp', 'image');
                larger_id = id.replace('vizcmp', 'twoD_labld_vw_no_hy');
                var pos = larger_id.lastIndexOf("_");
                if (pos != -1) {
                    var instPart = larger_id.slice(0, pos);
                    var tophitPart = larger_id.slice(pos + 1);
                    larger_id = instPart + '--' + tophitPart;
                }
            }
            refreshImage('#' + default_id, 'src');
            refreshImage('#' + larger_id, 'name');
        });
}
//////////////////// END: FUNCTION DEFINITIONS - Instance Search View //////////////////////////////////////////////////////	

//////////////////// BEGIN: EVENT HANDLERS - Instance Search View //////////////////////////////////////////////////////
$(document).on('click','.instnc_actions .rerun_srch', function(){
	var btnName = $(this).attr('name');
	var request = $(this).attr('value');
	var splitArr = btnName.split('_');
	var instId  = splitArr[2]+'_'+splitArr[3]+'_'+splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6];
	$('#adjst_params_'+instId).toggle('fast');
	if( request == 'Show Rerun Search Form'){
		$(this).attr('value','Hide Rerun Search Form');
	}
	else if( request == 'Hide Rerun Search Form' ){
		$(this).attr('value','Show Rerun Search Form');			
	}
});
$(document).on('click','.instnc_actions .rerun_srch_go', function(){
	var btnName = $(this).attr('name');
	var splitArr = btnName.split('_');
	var instId  = splitArr[3]+'_'+splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6]+'_'+splitArr[7];
	var instnc_profile_html = sessPathPrefix+'/'+instId+'/'+instId+'rerun_srch_instnc_profile.html';
	var rerunSrchFrm = '#rerun_srch_frm_'+instId;
	var linkRadiiTxtBx = rerunSrchFrm + ' #linkradii_'+instId;
	var bondRadiiTxtBx = rerunSrchFrm + ' #bondradii_'+instId;
	var linkRadiiErrMsg = rerunSrchFrm + ' #linkradii_errmsg_'+instId;
	var bondRadiiErrMsg = rerunSrchFrm + ' #bondradii_errmsg_'+instId;
	var rerunSrchFrmErrMsg = rerunSrchFrm + ' #adjst_params_errmsg_'+instId;
    $(rerunSrchFrm).ajaxSubmit({url: rerunInstncSrchUrl, async: true, 
		type: 'post', clearForm: false,
        beforeSubmit: function (formData, jqForm, options) {
        	var linkRadiiVal = $(linkRadiiTxtBx).val();
    		var bondRadiiVal = $(bondRadiiTxtBx).val();
    		if( isNaN( linkRadiiVal ) || isNaN( bondRadiiVal ) ){
    			if( isNaN( linkRadiiVal ) ){
    				$(linkRadiiErrMsg).html("Must be a number.").show().fadeOut(4000);
    			}
    			if( isNaN( bondRadiiVal ) ){
    				$(bondRadiiErrMsg).html("Must be a number.").show().fadeOut(4000);
    			}
    			return false;
    		}
    		else if( linkRadiiVal.length == 0 && bondRadiiVal.length == 0 ){
    			$(rerunSrchFrmErrMsg).html("Must provide at least one <br/>parameter for rerunning search.").show().fadeOut(4000);
    			return false;
    		}
    		else{
				$('#'+instId).toggle('slow');
                formData.push({"name": "sessionid", "value": sessionID});
				alert('Link radius delta set to: '+$(linkRadiiTxtBx).val()+'\nand bond radius delta set to: '+$(bondRadiiTxtBx).val() );
    		}
        }, success: function() {
        	$('#'+instId).load(instnc_profile_html,
        			function() {
				alert("Search has been rerun. New instance match data now being loaded.");
				$('#'+instId).toggle('slow');
			});
        }
    });
    return false;
});
$(document).on('click','.instnc_actions .rerun_comp_srch_go', function(){	
	var btnName = $(this).attr('name');
	var splitArr = btnName.split('_');
	var instId  = splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6]+'_'+splitArr[7]+'_'+splitArr[8];
	var instnc_profile_html = sessPathPrefix+'/'+instId+'/'+instId+'rerun_srch_instnc_profile.html';
	var rerunSrchFrm = '#rerun_comp_srch_frm_'+instId;
    $(rerunSrchFrm).ajaxSubmit({url: '/service/cc/assign/rerun_instnc_comp_srch', async: true, clearForm: false,
        beforeSubmit: function (formData, jqForm, options) {
		$('#'+instId).toggle('slow');
                formData.push({"name": "sessionid", "value": sessionID});
        }, success: function() {
        	$('#'+instId).load(instnc_profile_html,
        			function() {
				alert("Search has been rerun. New instance match data now being loaded.");
				$('#'+instId).toggle('slow');
			});
        },
        error: function (data, status, e) {alert(e);}
    });
    return false;
});
$(document).on('click','.allinst_assgn_actions .rerun_srch', function(){
	var btnName = $(this).attr('name');
	var request = $(this).attr('value');
	var splitArr = btnName.split('_');
	var grpId  = splitArr[2];
	$('#adjst_params_'+grpId).toggle('fast');
	if( request == 'Show Rerun Search Form'){
		$(this).attr('value','Hide Rerun Search Form');
	}
	else if( request == 'Hide Rerun Search Form' ){
		$(this).attr('value','Show Rerun Search Form');			
	}
});
$(document).on('click','.allinst_assgn_actions .rerun_srch_go', function(){
	var btnName = $(this).attr('name');
	var splitArr = btnName.split('_');
	var grpId  = splitArr[3];
	var grp_profile_html = sessPathPrefix+'/entity_grp_rerun_srchs/'+grpId+'/'+grpId+'_rerun_srch_entitygrp_profile.html';
	//alert('form is: '+$('#rerun_srch_frm_'+instId));
	//alert('form name is: '+$('#rerun_srch_frm_'+instId).attr('name'));
	var grpTblLctr = '#allinst_match_tbl_'+grpId;
	var instIdsLctr = grpTblLctr + ' td.instanceid';
	var rerunSrchFrm = '#rerun_srch_frm_'+grpId;
	var linkRadiiTxtBx = rerunSrchFrm + ' #linkradii_'+grpId;
	var bondRadiiTxtBx = rerunSrchFrm + ' #bondradii_'+grpId;
	var linkRadiiErrMsg = rerunSrchFrm + ' #linkradii_errmsg_'+grpId;
	var bondRadiiErrMsg = rerunSrchFrm + ' #bondradii_errmsg_'+grpId;
	var rerunSrchFrmErrMsg = rerunSrchFrm + ' #adjst_params_errmsg_'+grpId;
	var instIds = '';
	var instIdCnt = 0;
	$(instIdsLctr).each(function() {
    	instIdCnt++;
    	instIds += ((instIds.length > 0) ? ',' : '') + $(this).html();
		//alert("Value of instId #"+ instIdCnt + ": " + $(this).html() );
    });
    $(rerunSrchFrm).ajaxSubmit({url: rerunEntityGrpSrchUrl, async: true, clearForm: false,
        beforeSubmit: function (formData, jqForm, options) {
    		var linkRadiiVal = $(linkRadiiTxtBx).val();
    		var bondRadiiVal = $(bondRadiiTxtBx).val();
    		if( isNaN( linkRadiiVal ) || isNaN( bondRadiiVal ) ){
    			if( isNaN( linkRadiiVal ) ){
    				$(linkRadiiErrMsg).html("Must be a number.").show().fadeOut(4000);
    			}
    			if( isNaN( bondRadiiVal ) ){
    				$(bondRadiiErrMsg).html("Must be a number.").show().fadeOut(4000);
    			}
    			return false;
    		}
    		else if( linkRadiiVal.length == 0 && bondRadiiVal.length == 0 ){
    			$(rerunSrchFrmErrMsg).html("Must provide at least one <br/>parameter for rerunning search.").show().fadeOut(4000);
    			return false;
    		}
    		else{
				$('#'+grpId+'_inneraccordion').toggle('slow');
                formData.push({"name": "sessionid", "value": sessionID}, {"name": "instidlst", "value": instIds});
				alert('Link radius delta set to: '+$(linkRadiiTxtBx).val()+'\nand bond radius delta set to: '+$(bondRadiiTxtBx).val() );
                return true;
    		}
        }, success: function() {
        	$('#'+grpId+'_inneraccordion').load(grp_profile_html,
        			function() {
	            		$('.inneraccordion .head.'+grpId+'_hdr').each( function(index) {
	            			if(index > 0){
	            				var instnc_profile_html = $(this).next().attr('id');
	            				var instnc_id = $(this).next().attr('name');
	            				//alert("instnc_id is: "+instnc_id);
	            				if(instnc_profile_html.length){
	            					if( $('#'+instnc_id).html().length < 100 ){
	            						//alert("About to load instnc profile.");
	            						$('#'+instnc_id).load(instnc_profile_html,
	            							function() {
	            								//placeholder
	            						});
	            					}
	            				}
	            				$(this).next().hide();
	            			}
	            		});
        				alert("Search has been rerun. New match data now being loaded.");
        				$('#'+grpId+'_inneraccordion').toggle('slow');
					});
        	}
    });
    return false;
});
$(document).on('keyup','.allinst_assgn_actions .frc_assgn', function(){
	var frcAssgnTxtBxId = $(this).attr('id');
	limitChars(frcAssgnTxtBxId, 3);
	var refid = $(this).attr('name');
	var tblLctr = '#'+refid+'_t';
	var frcAssgnVlu = $(this).val();
	if( frcAssgnVlu.length > 0 ){
		$(tblLctr+" input:radio[name=assign_"+refid+"]").each( function() {
			$(this).attr('disabled','disabled').prop('checked', false);
		});
	}
	else{
		$(tblLctr+" input:radio[name=assign_"+refid+"]").each( function() {
			$(this).removeAttr('disabled');
		});
	}
});
$(document).on('click','.allinst_assgn_actions .commit_assgn', function(){	
	var request = $(this).attr('value');
	var thisBtn = $(this);
	var authAssgnGrp = $(this).attr('name');
	var hdrLctr = '.'+authAssgnGrp+'_hdr';
	var spanLctr = '.assgn_status.'+authAssgnGrp;
	var ccIdSpanLctr = spanLctr+' .ccid_assgnmnt';
	var tblLctr = '#'+authAssgnGrp+'_t';
	var frcAssgnTxtBx = '#frc_assgn_'+authAssgnGrp;
	var snglInstBtnsLctr = '.instnc_actions.c_'+authAssgnGrp+' .commit_assgn.c_'+authAssgnGrp;
	var snglInstTblsLctr = '.instnc_match_rslts.c_'+authAssgnGrp;
	var numAssgndInGrp = Number( $('#'+authAssgnGrp+'_assgn_cnt').html() );
	var allShowRernSrchBtnsLctr = '.rerun_srch.c_'+authAssgnGrp;
	var allRernSrchParamsLctr = '.rerun_srch_param.c_'+authAssgnGrp;
	var allRernSrchBtnsLctr = '.rerun_srch_go.c_'+authAssgnGrp;
	var snglInstEdtNwLigBtnsLctr = '.edt_nw_lig.c_'+authAssgnGrp;
	var snglInstGetNewCcIdBtnsLctr = '.get_new_cc_id.c_'+authAssgnGrp;
	var frcAssgnTxtBxsGlbl = '.frc_assgn.c_'+authAssgnGrp;
	var batchRsltsTbl = '#allinst_match_tbl_'+authAssgnGrp;
	var glblBatchRsltsTbl = '#batch_summary_match_tbl';
	var assgnTblVlu = $(tblLctr+' input:radio[name=assign_'+authAssgnGrp+']:checked').val();
	var frcAssgnVlu = $(frcAssgnTxtBx).val().toUpperCase();
	var ccIdAssgnd;
	var instAssgnChngCnt = 0;
	var instIdList = '';
	$(batchRsltsTbl+' tr.c_'+authAssgnGrp+' .instanceid').each( function() {
		var instId = $(this).html();
		instAssgnChngCnt++;
    	instIdList += ((instIdList.length > 0) ? ',' : '') + instId;
	});
	var frcAssgnMode = 'no';
	var assgnActnCancld = false;
	var disableCntrls = function(mode) {
		$(snglInstBtnsLctr).each(function() {
			$(this).attr('disabled','disabled');
		});
		$(allShowRernSrchBtnsLctr).each( function() {
			$(this).attr('disabled','disabled');
		});
		$(allRernSrchParamsLctr).each( function() {
			$(this).attr('disabled','disabled');
		});
		$(allRernSrchBtnsLctr).each( function() {
			$(this).attr('disabled','disabled');
		});
		$(snglInstEdtNwLigBtnsLctr).each( function() {
			$(this).attr('disabled','disabled');
		});
		$(snglInstGetNewCcIdBtnsLctr).each( function() {
			$(this).attr('disabled','disabled');
		});
		$(frcAssgnTxtBxsGlbl).each( function() {
			$(this).attr('disabled','disabled');
		});
		if( mode == 'assign'){
			$(tblLctr+' input:radio[name=assign_'+authAssgnGrp+']').each( function() {
				$(this).attr('disabled','disabled');
			});
			$(snglInstTblsLctr+' input:radio').each( function() {
				$(this).attr('disabled','disabled');
			});
			$(frcAssgnTxtBxsGlbl).each( function() {
				$(this).attr('value','');
			});
		}
		else if( mode == 'validate'){
			$(thisBtn).attr('disabled','disabled');
		}
	}
	var enableCntrls = function(mode) {
		$(snglInstBtnsLctr).each(function() {
			$(this).removeAttr('disabled');
		});
		$(snglInstTblsLctr+' input:radio').each( function() {
			$(this).removeAttr('disabled');
		});
		$(allShowRernSrchBtnsLctr).each( function() {
			$(this).removeAttr('disabled');
		});
		$(allRernSrchParamsLctr).each( function() {
			$(this).removeAttr('disabled');
		});
		$(allRernSrchBtnsLctr).each( function() {
			$(this).removeAttr('disabled');
		});
		$(snglInstEdtNwLigBtnsLctr).each( function() {
			$(this).removeAttr('disabled');
		});
		$(snglInstGetNewCcIdBtnsLctr).each( function() {
			$(this).removeAttr('disabled');
		});
		$(frcAssgnTxtBxsGlbl).each( function() {
			$(this).removeAttr('disabled');
		});
		if( mode == 'assign'){
			$(tblLctr+" input:radio[name=assign_"+authAssgnGrp+"]").each( function() {
				$(this).removeAttr('disabled');
			});
			$(frcAssgnTxtBxsGlbl).each( function() {
				$(this).val('');
			});
		}
		else if( mode == 'validate'){
			$(thisBtn).removeAttr('disabled');
		}
	}
	var updateAssignState = function(){
		if( assgnActnCancld != true ){
			$(hdrLctr).each( function() {
				$(this).toggleClass("is_assgnd");
			});
			$(spanLctr).each( function() {
				$(this).toggle();
			});
		}
        }
	var doAssignAllInstncs = function(){
		$.ajax({type: 'POST',url: assignInstanceUrl,
			   data: 'instance='+instance+'&identifier='+depId+'&filesource='+fileSource+'&sessionid='+sessionID+'&instidlist='+instIdList+'&ccid='+ccIdAssgnd+'&assgn_mode=glbl&auth_assgn_grp='+authAssgnGrp+'&frc_assgn_mode='+frcAssgnMode,
                           dataType: 'json',
			   success: function(jsonOBJ){
					//alert( "Data Saved for instances ("+instIdList+") and assgndCnt is now: "+numAssgndInGrp);
                               if (jsonOBJ.errorflag) {
                                    alert(jsonOBJ.errortext);
                                    assgnActnCancld = true;
                                    enableCntrls('assign');
                                    $(thisBtn).attr('value','Assign');
                               } else {
					$(thisBtn).attr('value','Un-Assign');
					$(ccIdSpanLctr).each( function() {
						$(this).html(""+ccIdAssgnd+"");
					});
					$(batchRsltsTbl+' tr.c_'+authAssgnGrp+' .prcssng_status').each( function() {
						$(this).html('<span class="ccid_assgnmnt">'+ccIdAssgnd+'</span>');
					});
					$(batchRsltsTbl+' tr.c_'+authAssgnGrp+' .instanceid').each( function() {
						var instId = $(this).html();
						$(glblBatchRsltsTbl+' tr.c_'+authAssgnGrp+' .assgnmnt_status.'+instId).each( function() {
							$(this).html(ccIdAssgnd);
						});
					});
					$(snglInstTblsLctr+' input:radio').each( function() {
						var ccid = $(this).parent().siblings('td.entityid:first').text();
						if( ccid == ccIdAssgnd ){
							$(this).prop('checked', true);
						}
						else{
							$(this).prop('checked', false);
						}
					});
					numAssgndInGrp = numAssgndInGrp + instAssgnChngCnt;
					$('#'+authAssgnGrp+'_assgn_cnt').html(numAssgndInGrp);
					disableCntrls('assign');
                               }
                               updateAssignState();
	                   }
		});
	}
	var doUnAssignAllInstncs = function(){
		$(thisBtn).attr('value','Assign');
		$(ccIdSpanLctr).each( function() {
			$(this).html();
		});
		$(batchRsltsTbl+' tr.c_'+authAssgnGrp+' .prcssng_status').each( function() {
			$(this).html('Not Assigned');
		});
		$(batchRsltsTbl+' tr.c_'+authAssgnGrp+' .instanceid').each( function() {
			var instId = $(this).html();
			$(glblBatchRsltsTbl+' tr.c_'+authAssgnGrp+' .assgnmnt_status.'+instId).each( function() {
				$(this).html('Not Assigned');
			});
		});
		numAssgndInGrp = numAssgndInGrp - instAssgnChngCnt;
		$('#'+authAssgnGrp+'_assgn_cnt').html(numAssgndInGrp);
		enableCntrls('assign');
		$.ajax({type: 'POST',url: assignInstanceUrl,
			data: 'instance='+instance+'&identifier='+depId+'&filesource='+fileSource+'&sessionid='+sessionID+'&instidlist='+instIdList+'&ccid=Not%20Assigned&assgn_mode=glbl&auth_assgn_grp='+authAssgnGrp,
			   success: function(){
					//alert( "Data Saved for instances ("+instIdList+") and assgndCnt is now: "+numAssgndInGrp);
					updateAssignState();
	            }								
		});
	}
	if( typeof(frcAssgnVlu) == "undefined" || frcAssgnVlu.length == 0 ){
		ccIdAssgnd = assgnTblVlu;
	}
	else{
		ccIdAssgnd = frcAssgnVlu;
		frcAssgnMode = 'yes';
		//alert('Using force assign value! frcAssgnMode is '+frcAssgnMode);
	}
	if( request == 'Un-Assign' && (typeof(ccIdAssgnd) == "undefined" || ccIdAssgnd.length == 0 ) ){
		ccIdAssgnd = 'Not Assigned';
	}
	if( typeof(ccIdAssgnd) != "undefined" && ccIdAssgnd.length > 0 ){
		//alert('ccIdAssgnd is: '+ccIdAssgnd);
		//alert('ccIdSpanLctr value is: '+ccIdSpanLctr);
		//alert('ccIdSpanLctr found is: '+$(ccIdSpanLctr));
		if( request == 'Assign'){
			if( frcAssgnMode == 'yes' ){
				disableCntrls('validate');
				$.ajax({type: 'POST', url: validateCcIdUrl, async: false,
					   data: 'instance='+instance+'&identifier='+depId+'&filesource='+fileSource+'&sessionid='+sessionID+'&auth_assgn_grp='+authAssgnGrp+'&ccid='+ccIdAssgnd+'&instidlist='+instIdList+"&instncmode=all&vldtmode=full",
					   beforeSend: function (){
							//disableCntrls('#'+authAssgnGrp+'_inneraccordion','input',true);
							var answer = confirm('Warning: You are forcing assignment of the chemical component(s) in question to "'+ccIdAssgnd+'". Please confirm.');
					        if (answer){
					        	return true;
					        }
					        else{
					            alert("Cancelling Force Assignment.");
					            assgnActnCancld = true;
					            enableCntrls('validate');
					            return false;
					        }
					   },							
					   success: function(jsonObj) {
                                               if (jsonObj.errorflag) {
                                                    alert(jsonObj.errortext);
			                	    enableCntrls('validate');
			                            assgnActnCancld = true;
						    updateAssignState();
                                               } else {
			                	    enableCntrls('validate');
			                	    doAssignAllInstncs();
			                       }
			                  }
				});
			}
			else{
				doAssignAllInstncs();
			}
		}
		else{
			doUnAssignAllInstncs();
		}
	}
	else{
		if( request == 'Assign' ){
			alert('No ID selected for assignment. Please select ID first.');
		}
	}
});
$(document).on('change','.allinst_select', function(){
	var instid = $(this).val();
	$(this).parents('table:first').find('tr.allinst_assgn_rw').hide();
	$(this).parents('table:first').find('tr.assign_'+instid).show();	
});
$(document).on('click','.all_instncs_match_rslts .vizcmp_chck_bx', function(){
	var checked = $(this).prop("checked");
	var instid = $(this).attr('value');
	var refid = $(this).attr('name');
	var checkedCnt = $('#allinst_match_tbl_'+refid+' :checkbox:checked').size();
	//alert('instid is: '+instid);
	//alert('Count of allinst_match_tbl_'+refid+' checkboxes that are checked is: '+ checkedCnt);
	toggleChemCompDisplay(instid,refid,ALL_INSTNC,checked);
	$('#viz_compare_'+refid).css('display', checkedCnt>0 ? 'block' : 'none');
});
$(document).on('click','.all_instances .atm_mp_chck_bx', function(){
	var checked = this.checked;
	var refid = $(this).attr('name');
	var threeDchecked = $('#threeD_chck_bx_'+refid).prop("checked");
	var ulElemLocator = ' #instance_data_' + refid;
	var atmMpDivElemLocator = ulElemLocator + ' div.atm_mp';
	var reloadJmolBtnLctr = ulElemLocator + ' .reload_jmol.aivw';
	var atmMpHtmlUrl;
	var instid;
	$(atmMpDivElemLocator).each( function(n) {
		instid = $(this).attr('name');
		if( $(this).hasClass("exp") ){
			atmMpHtmlUrl = sessPathPrefix + '/' + instid +'/'+instid+'instnc_atm_mp_li.html';
		}
		if( $(this).length < 100 ){
			$(this).children('ul').load(atmMpHtmlUrl);
		}
	});
	$(atmMpDivElemLocator).css('display', checked ? 'block' : 'none');
	$(reloadJmolBtnLctr).css('display', checked ? 'inline' : 'none');
	if( !checked && threeDchecked ){
		$(reloadJmolBtnLctr).click();
	}
	$('.threeD_environ_vw_btn.type1.aivw',ulElemLocator).css('display', checked ? 'none' : 'inline');
	$(atmMpDivElemLocator).synchronizeScroll();
});
$(document).on('click','.all_instances .threeD_chck_bx', function(){
	var checked = this.checked;
	var refid = $(this).attr('name');
	var ulElemLocator = ' #instance_data_' + refid;
	var threeDdivElemLocator = ulElemLocator + ' div.threeDviz';
	var reloadJmolBtnLctr = ulElemLocator + ' input.reload_jmol';
	var threeDenvironVwBtns = ulElemLocator + ' input.threeD_environ_vw_btn.type1.aivw';
	var jmolHtmlUrl;
	var instid;
	$(threeDdivElemLocator).each( function(n) {
		instid = $(this).attr('name');
		var thisId = $(this).attr('id');
		if(checked){
			var expThreeDdivId = 'allinst_threeD_'+instid;
			var uniqeId = getUniqueIdForJsmol(instid);
			jmolHtmlUrl = sessPathPrefix + '/' + instid +'/'+instid+'instnc_jmol_allInstVw.html';
			
			//invoke jsmol for experimental data
			if( !( $('#allinst_e'+uniqeId+'_appletinfotablediv').length ) ){
				if (depId == 'TMP_ID' || isAnnotation(fileSource) == true) {
					loadFilePath = sessPathPrefix+'/'+instid+'/report/'+refid+'_model.cif';
				} else {
					loadFilePath = '/service/cc_lite/report/file?identifier=' + depId + '&source=author&ligid=' + instid + '&file=' + refid + '_model.cif';
				}

				loadFileJsmol("allinst_e"+uniqeId,expThreeDdivId,loadFilePath,"default");
				$('#allinst_e'+uniqeId+"_appletinfotablediv").css({'padding-left':'0px', 'border-style':'none'});
				$('#allinst_e'+uniqeId+"_appletdiv").css({'padding-left':'0px', 'border-style':'none'});
				$.get(jmolHtmlUrl, function(data){
					$("#"+thisId).append(data);
				}, "html");
			}
			$(threeDdivElemLocator).css('display', 'block');
		}
		else{
			$(threeDdivElemLocator).css('display', 'none');
		}
	});
	var atmMapChecked = $('#atm_mp_chck_bx_'+refid).prop("checked");
	//alert("atmMapChecked? "+atmMapChecked);
	$(reloadJmolBtnLctr).css('display', atmMapChecked ? 'inline' : 'none');
	$(threeDenvironVwBtns).css('display', atmMapChecked ? 'none' : 'inline');
});
$(document).on('click','.all_instances .twoD_chck_bx', function(){
	var checked = this.checked;
	var refid = $(this).attr('name');
	var ulElemLocator = ' #instance_data_' + refid;
	var twoDdivElemLocator = ulElemLocator + ' div.twoDviz';
	$(twoDdivElemLocator).css('display', checked ? 'block' : 'none');
});
$(document).on('keyup','.instnc_actions .frc_assgn', function(){
	var frcAssgnTxtBxId = $(this).attr('id');
	limitChars(frcAssgnTxtBxId, 3);
	var instid = $(this).attr('name');
	var tblLctr = '#'+instid+'_t';
	var frcAssgnVlu = $(this).val();
	if( frcAssgnVlu.length > 0 ){
		$(tblLctr+" input:radio[name=assign_"+instid+"]").each( function() {
			$(this).attr('disabled','disabled').prop('checked', false);
		});
	}
	else{
		$(tblLctr+" input:radio[name=assign_"+instid+"]").each( function() {
			$(this).removeAttr('disabled');
		});
	}
});
$(document).on('click','.instnc_actions .commit_assgn', function(){
	//alert("inside handler for Assign/UnAssign buttton");
	var request = $(this).attr('value');
	var instid = $(this).attr('name');
	//alert("value of request is: "+request);
	//alert("value of instid is: "+instid);
	var thisBtn = $(this);
	var hdrLctr = '#'+instid+'_hdr';
	var spanLctr = hdrLctr+' .assgn_status';
	var ccIdSpanLctr = hdrLctr+' .ccid_assgnmnt';
	var tblLctr = '#'+instid+'_t';
	var frcAssgnTxtBx = '#frc_assgn_'+instid;
	var authAssgnGrp = (instid.split('_'))[2];
	//alert('authAssgnGrp is: '+authAssgnGrp);
	var allInstTblLctr = '#'+authAssgnGrp+'_t';
	var numAssgndInGrp = Number( $('#'+authAssgnGrp+'_assgn_cnt').html() );
	var showRerunSrchBtn = '#rerun_srch_'+instid;
	var rernSrchParamsLctr = '.rerun_srch_param.c_'+instid;
	var rerunBtn = '#rerun_srch_go_'+instid;
        var rerunBtnComp = '#rerun_comp_srch_go_'+instid;
        var chopperBtn = '#chop_lig_'+instid;
	var allInstShowRerunSrchBtn = '#rerun_srch_'+authAssgnGrp;
	var allInstRernSrchParamsLctr = '#adjst_params_'+authAssgnGrp+' .rerun_srch_param.c_'+authAssgnGrp;
	var allInstRernSrchBtn = '#rerun_srch_go_'+authAssgnGrp;
	var editNewLigBtn = '#edt_nw_lig_'+instid;
	var getNewCcIdBtn = '#get_new_cc_id_'+instid;
	var frcAssgnTxtBx = '#frc_assgn_'+instid;
	var allInstFrcAssgnTxtBx = '#frc_assgn_'+authAssgnGrp;
	var batchRsltsTbl = '#allinst_match_tbl_'+authAssgnGrp;
	var glblBatchRsltsTbl = '#batch_summary_match_tbl';
	//alert('numAssgndInGrp was read from page as: '+numAssgndInGrp);
	var assgnTblVlu = $(tblLctr+' input:radio[name=assign_'+instid+']:checked').val();
	var frcAssgnVlu = $(frcAssgnTxtBx).val().toUpperCase();
	var ccIdAssgnd;
	var frcAssgnMode = 'no';
	var assgnActnCancld = false;
	var disableCntrls = function(mode) {
		$(showRerunSrchBtn).attr('disabled','disabled');
		$(rernSrchParamsLctr).attr('disabled','disabled');
		$(rerunBtn).attr('disabled','disabled');
		$(rerunBtnComp).attr('disabled','disabled');
		$(chopperBtn).attr('disabled','disabled');
		$(editNewLigBtn).attr('disabled','disabled');
		$(getNewCcIdBtn).attr('disabled','disabled');
		$(frcAssgnTxtBx).attr('disabled','disabled');
		$('.allinst_assgn_actions .commit_assgn.c_'+authAssgnGrp).attr('disabled','disabled');			
		$(allInstShowRerunSrchBtn).attr('disabled','disabled');
		$(allInstRernSrchParamsLctr).attr('disabled','disabled');
		$(allInstRernSrchBtn).attr('disabled','disabled');
		$(allInstFrcAssgnTxtBx).attr('disabled','disabled');
		if( mode == 'assign'){
			$(tblLctr+" input:radio[name=assign_"+instid+"]").each( function() {
				$(this).attr('disabled','disabled');
			});
			$(allInstTblLctr+" input:radio[name=assign_"+authAssgnGrp+"]").each( function() {
				$(this).attr('disabled','disabled').prop('checked', false);
			});
		}
		else if( mode == 'validate'){
			$(thisBtn).attr('disabled','disabled');
		}
	}
	var enableCntrls = function(mode) {
		$(showRerunSrchBtn).removeAttr("disabled");
		$(rernSrchParamsLctr).removeAttr("disabled");
		$(rerunBtn).removeAttr("disabled");
		$(rerunBtnComp).removeAttr("disabled");
		$(chopperBtn).removeAttr("disabled");
		$(editNewLigBtn).removeAttr("disabled");
		$(getNewCcIdBtn).removeAttr("disabled");
		$(frcAssgnTxtBx).removeAttr("disabled");
		if( numAssgndInGrp == 0 ){
			$('.allinst_assgn_actions .commit_assgn.c_'+authAssgnGrp).removeAttr('disabled');
			$(allInstShowRerunSrchBtn).removeAttr("disabled");
			$(allInstRernSrchParamsLctr).removeAttr("disabled");
			$(allInstRernSrchBtn).removeAttr("disabled");
			$(allInstFrcAssgnTxtBx).removeAttr("disabled");
			if( mode == 'assign'){
				$(allInstTblLctr+" input:radio[name=assign_"+authAssgnGrp+"]").each( function() {
					$(this).removeAttr("disabled");
				});	
			}
		}
		if( mode == 'assign'){
			$(tblLctr+" input:radio[name=assign_"+instid+"]").each( function() {
				$(this).removeAttr('disabled');
			});
			$(frcAssgnTxtBx).val('');
		}
		else if( mode == 'validate'){
			$(thisBtn).removeAttr('disabled');
		}
	}
	var doAssignInstnc = function() {
		$(thisBtn).attr('value','Un-Assign');
		$(ccIdSpanLctr).html(""+ccIdAssgnd+"");
		$(batchRsltsTbl+' tr.c_'+instid+' .prcssng_status').each( function() {
			$(this).html('<span class="ccid_assgnmnt">'+ccIdAssgnd+'</span>');
		});
		$(glblBatchRsltsTbl+' tr.c_'+instid+' .assgnmnt_status').each( function() {
			$(this).html(ccIdAssgnd);
		});
		numAssgndInGrp = numAssgndInGrp + 1;
		$('#'+authAssgnGrp+'_assgn_cnt').html(numAssgndInGrp);
		//alert('Number of assigned in group '+authAssgnGrp+' is now: '+numAssgndInGrp);
		disableCntrls('assign');
		$.ajax({type: 'POST',url: assignInstanceUrl,
			   data: 'instance='+instance+'&identifier='+depId+'&filesource='+fileSource+'&sessionid='+sessionID+'&instidlist='+instid+'&ccid='+ccIdAssgnd+'&assgn_mode=sngl',
                           dataType: 'json',
			   success: function(jsonOBJ){
			     //alert( "Data Saved: " + msg );
                               if (jsonOBJ.errorflag) {
                                    assgnActnCancld = true;
                                    alert(jsonOBJ.errortext);
                               }
			   }
		});
	}
	var doUnAssignInstnc = function() {
		$(thisBtn).attr('value','Assign');
		$(ccIdSpanLctr).html();
		$(batchRsltsTbl+' tr.c_'+instid+' .prcssng_status').each( function() {
			$(this).html('Not Assigned');
		});
		$(glblBatchRsltsTbl+' tr.c_'+instid+' .assgnmnt_status').each( function() {
			$(this).html('Not Assigned');
		});
		numAssgndInGrp = numAssgndInGrp - 1;
		if( numAssgndInGrp < 0 ){
			numAssgndInGrp = 0;
		}
		//alert('Number of assigned in group '+authAssgnGrp+' is now: '+numAssgndInGrp);
		$('#'+authAssgnGrp+'_assgn_cnt').html(numAssgndInGrp);
		enableCntrls('assign');
		$.ajax({type: 'POST',url: assignInstanceUrl,
			   data: 'instance='+instance+'&identifier='+depId+'&filesource='+fileSource+'&sessionid='+sessionID+'&instidlist='+instid+'&ccid=Not%20Assigned&assgn_mode=sngl',
			   success: function(msg){
			     //alert( "Data Saved: " + msg );
			   }
		});
	}
	//alert("value of frcAssgnVlu is: "+frcAssgnVlu);
	if( typeof(frcAssgnVlu) == "undefined" || frcAssgnVlu.length == 0 ){
		ccIdAssgnd = assgnTblVlu;
	}
	else{
		//alert('Using force assign value!');
		ccIdAssgnd = frcAssgnVlu;
		frcAssgnMode = 'yes';
		//alert('Using force assign value! frcAssgnMode is '+frcAssgnMode);
	}
	if( (typeof(ccIdAssgnd) != "undefined" && ccIdAssgnd.length > 0 ) || request == 'Un-Assign'){
		if( request == 'Assign'){
			if( frcAssgnMode == 'yes' ){
				disableCntrls('validate');
				$.ajax({type: 'POST', url: validateCcIdUrl, async: false,
					   data: 'instance='+instance+'&identifier='+depId+'&filesource='+fileSource+'&sessionid='+sessionID+'&ccid='+ccIdAssgnd+'&instidlist='+instid+"&instncmode=single&vldtmode=full",
					   beforeSend: function (){
							var answer = confirm('Warning: You are forcing assignment of the chemical component(s) in question to "'+ccIdAssgnd+'". Please confirm.');
					        if (answer){
					        	return true;
					        }
					        else{
					            alert("Cancelling Force Assignment.")
					            enableCntrls('validate');
					            assgnActnCancld = true;
					            return false;
					        }
					   },
					   success: function(jsonObj) {
                                               if (jsonObj.errorflag) {
                                                    alert(jsonObj.errortext);
			                	    enableCntrls('validate');
			                            assgnActnCancld = true;
                                               } else {
			                	    enableCntrls('validate');
			                	    doAssignInstnc();				                	
			                       }
			                   }
				});
			}
			else{
				doAssignInstnc();
			}
		}
		else{
			//alert("Inside handler for Un-Assign");
			doUnAssignInstnc();
		}
		if( assgnActnCancld != true ){
			$(hdrLctr).toggleClass("is_assgnd");
			$(spanLctr).toggle();
		}
	}
	else{
		if( request == 'Assign' ){
			alert('No ID selected for assignment. Please select ID first.');
		}
		//else{
			//alert('Un-Assign but ccid value is undefined.');
		//}
	}
});
$(document).on('click','.instnc_actions .edt_nw_lig', function(){
	var btnName = $(this).attr('name');
	var request = $(this).attr('value');
	var splitArr = btnName.split('_');
	var instId  = splitArr[3]+'_'+splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6]+'_'+splitArr[7];
	$('#get_new_cc_id_'+instId).show();
        $('#get_new_image_'+instId).show();
});

$(document).on('click','.instnc_actions .create_new_lig_go', function(){
	var btnName = $(this).attr('name');
	var splitArr = btnName.split('_');
	var instId  = splitArr[3]+'_'+splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6]+'_'+splitArr[7];
        var editorFrm = '#create_new_lig_' + instId + '_frm';
        var targetName = $(editorFrm).attr("target");
        $(editorFrm).ajaxSubmit({url: '/service/cc/edit/launch', async: true, clearForm: false,
             beforeSubmit: function (formData, jqForm, options) {
                  formData.push({"name": "pdbid", "value": pdbId}, {"name": "annotator", "value": annotator});
             },
             success: function(jsonObj) {
                  myWin = window.open('', targetName);
                  myWin.document.write(jsonObj.htmlcontent);
                  myWin.document.close();
             }
        });
});

$(document).on('click','.instnc_actions .chop_lig_go', function(){
	var btnName = $(this).attr('name');
	var splitArr = btnName.split('_');
	var instId  = splitArr[2]+'_'+splitArr[3]+'_'+splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6];
        var chopperFrm = '#chop_lig_' + instId + '_frm';
        var targetName = $(chopperFrm).attr("target");
        $(chopperFrm).ajaxSubmit({url: '/service/cc/chopper/launch', async: true, clearForm: false,
             beforeSubmit: function (formData, jqForm, options) {
                  formData.push({"name": "pdbid", "value": pdbId}, {"name": "annotator", "value": annotator});
             },
             success: function(jsonObj) {
                  myWin = window.open('', targetName);
                  myWin.document.write(jsonObj.htmlcontent);
                  myWin.document.close();
             }
        });
});

$(document).on('click','.instnc_actions .get_new_cc_id', function(){
	var btnName = $(this).attr('name');
	var btnId = $(this).attr('id');
	var splitArr = btnName.split('_');
	var instId  = splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6]+'_'+splitArr[7]+'_'+splitArr[8];
	//alert('On clicking Get New CC ID button got instId of:'+instId);
	var frcAssgnTxtBx = '#frc_assgn_'+instId;
        var frcAssgnAllTxtBx = '#frc_assgn_'+splitArr[6];
	var getNewCcIdFrmLctr = '#assgn_new_cc_def_'+instId+'_frm';
	var newCcId = '';
	$(getNewCcIdFrmLctr).ajaxSubmit({url: getNewCcIdUrl, async: true, clearForm: false,
        success: function(jsonObj) {
            newCcId = jsonObj.statuscode;
            if( newCcId != 'NONE'){
            	// alert('New ID "'+newCcId+'" has been created and now appears in the textbox for Force Assignment.');
                $(frcAssgnTxtBx).attr('value',newCcId);
                $(frcAssgnAllTxtBx).attr('value',newCcId);
                $('#'+btnId).hide();
                var txt = $('#cvs_commit_ccid_list').text();
                if (txt == '') {
                    $('#cvs_commit_ccid_list').text(newCcId);
                } else if (txt.indexOf(newCcId) == -1) {
                    txt += ","+newCcId;
                    $('#cvs_commit_ccid_list').text(txt);
                }
                $('#cvs_commit_ccid_div').show();
            }
            else{
                alert('New ID not yet created.');
            }
        }
	});
    return false;
}); 

$(document).on('click','.instnc_actions .get_new_image', function(){
	var btnName = $(this).attr('name');
	var splitArr = btnName.split('_');

	var instId  = splitArr[3]+'_'+splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6]+'_'+splitArr[7];
        refreshInstImages(instId);
	var btnId = $(this).attr('id');
        $('#'+btnId).hide();
        return false;
}); 

$(document).on('click','.instnc_match_rslts .vizcmp_chck_bx', function(){
	//alert('Captured click event');
	var checked = $(this).prop("checked");
	var refid = $(this).attr('value');
	var instid = $(this).attr('name');
	toggleChemCompDisplay(instid,refid,SNGL_INSTNC,checked);
});
$(document).on('click','.single_instance .threeD_chck_bx', function(){
	//alert('Captured click event');
	var checked = this.checked;
	var instid = $(this).attr('name');
	var ulElemLocator = ' #instance_data_' + instid;
	var threeDdivElemLocator = ulElemLocator + ' div.threeDviz';
	var reloadJmolBtnLctr = ulElemLocator + ' input.reload_jmol';
	var jmolHtmlUrl;
	var refCcId;
	var authAssgndId;
	var loadFilePath;
	var refThreeDdivId;
	var expThreeDdivId;
	
	if(checked){
		$(threeDdivElemLocator).each( function(n) {
			var uniqeId = getUniqueIdForJsmol(instid);
			var thisId = $(this).attr('id');
			if( $(this).hasClass("ref") ){
				refCcId = $(this).attr('name');

				if (depId == 'TMP_ID' || isAnnotation(fileSource) == true) {
					loadFilePath = sessPathPrefix+'/rfrnc_reports/'+refCcId+'/'+refCcId+'_ideal.cif';
				} else {
					loadFilePath = '/service/cc_lite/report/file?identifier=' + depId + '&source=ccd&ligid=' + refCcId + '&file=' + refCcId + '_ideal.cif';
				}

				refThreeDdivId = 'threeD_'+instid+'_'+refCcId;
				jmolHtmlUrl = sessPathPrefix +'/'+instid+'/'+refCcId+'_ref_jmol.html';
				
				//invoke jsmol for dictionary reference
				if( !($('#r'+uniqeId+refCcId+'_appletinfotablediv').length ) ) {
					//alert("found that jsMol appletinfotablediv does not exist yet.");
					if( $('#'+refThreeDdivId).length ){
						//alert("Container div: "+refThreeDdivId+" found so will populate via call to loadFileJsmol.");
						loadFileJsmol('r'+uniqeId+refCcId,refThreeDdivId,loadFilePath,"default");
						$('#r'+uniqeId+refCcId+'_appletinfotablediv').css({'padding-left':'0px', 'border-style':'none'});
						$('#r'+uniqeId+refCcId+'_appletdiv').css({'padding-left':'0px', 'border-style':'none'});
					}else{ alert("Container div: "+refThreeDdivId+" not found."); }
					$.get(jmolHtmlUrl, function(data){
						$("#"+thisId).append(data);
					}, "html");
				}
			}
			else if( $(this).hasClass("exp") ){
				authAssgndId = $(this).attr('name');

				if (depId == 'TMP_ID' || isAnnotation(fileSource) == true) {
					loadFilePath = sessPathPrefix+'/'+instid+'/report/'+authAssgndId+'_model.cif';
				} else {
					loadFilePath = '/service/cc_lite/report/file?identifier=' + depId + '&source=author&ligid=' + instid + '&file=' + authAssgndId + '_model.cif';
				}
				
				expThreeDdivId = 'threeD_'+instid;
				jmolHtmlUrl = sessPathPrefix + '/' + instid +'/'+instid+'instnc_jmol_instVw.html';
				
				//invoke jsmol for experimental data
				if( !( $('#e'+uniqeId+'_appletinfotablediv').length ) ){
					loadFileJsmol("e"+uniqeId,expThreeDdivId,loadFilePath,"default");
					$('#e'+uniqeId+"_appletinfotablediv").css({'padding-left':'0px', 'border-style':'none'});
					$('#e'+uniqeId+"_appletdiv").css({'padding-left':'0px', 'border-style':'none'});
					$.get(jmolHtmlUrl, function(data){
						$("#"+thisId).append(data);
					}, "html");
				}
			}
			/***$.get(jmolHtmlUrl, function(data){
				$("#"+thisId).append(data);
			}, "html");***/
		});
		
		$(threeDdivElemLocator).css('display', 'block');
	}
	else{
		$(threeDdivElemLocator).css('display', 'none');
	}
	
	var atmMapChecked = $('#atm_mp_chck_bx_'+instid).prop("checked");
	//alert("atmMapChecked is: "+atmMapChecked);
	$(reloadJmolBtnLctr).css('display', atmMapChecked ? 'inline' : 'none');
	$('#threeD_environ_vw_1_'+instid).css('display', atmMapChecked ? 'none' : 'inline');
});
$(document).on('click','.single_instance .twoD_chck_bx', function(){
	var checked = this.checked;
	var instid = $(this).attr('name');
	var ulElemLocator = ' #instance_data_' + instid;
	var twoDdivElemLocator = ulElemLocator + ' div.twoDviz';
	$(twoDdivElemLocator).css('display', checked ? 'block' : 'none');
});
$(document).on('click','.single_instance .atm_mp_chck_bx', function(){
	//alert('Captured click event');
	var checked = this.checked;
	var instid = $(this).attr('name');
	var ulElemLocator = ' #instance_data_' + instid;
	var threeDchecked = $('#threeD_chck_bx_'+instid).prop("checked");
	var atmMpDivElemLocator = ulElemLocator + ' div.atm_mp ';
	var reloadJmolBtnLctr = ulElemLocator + ' input.reload_jmol';
	var atmMpHtmlUrl;
	var refid;
	$(atmMpDivElemLocator).each( function(n) {
		if( $(this).hasClass("ref") ){
			refid = $(this).attr('name');
			atmMpHtmlUrl = sessPathPrefix +'/'+instid+'/'+refid+'_ref_atm_mp_li.html';
		}
		else if( $(this).hasClass("exp") ){
			atmMpHtmlUrl = sessPathPrefix + '/' + instid +'/'+instid+'instnc_atm_mp_li.html';
		}
		if( $(this).length < 100 ){
			$(this).children('ul').load(atmMpHtmlUrl);
		}
	});
	$(atmMpDivElemLocator).css('display', checked ? 'block' : 'none');
	$(reloadJmolBtnLctr).css('display', checked ? 'inline' : 'none');
	if( !checked && threeDchecked ){
		$(reloadJmolBtnLctr).click();
	}
	$('#threeD_environ_vw_1_'+instid).css('display', checked ? 'none' : 'inline');
	$('.atm_mp.'+instid).synchronizeScroll();
});
$(document).on('click','.atm_mp_btn', function(){
	//alert('Captured click event');
	var refId;
	var instId;
	var jmolId;
	var jmolCmd;
	var atomNm;
	var uniqeId;
	var btnName = $(this).attr('name');
	var splitArr = btnName.split('_');
	if( $(this).hasClass("ref") ){
		refId = splitArr[1];
		instId  = splitArr[2]+'_'+splitArr[3]+'_'+splitArr[4]+'_'+splitArr[5]+'_';
		uniqeId = getUniqueIdForJsmol(instId);
		jmolId = 'r'+uniqeId+refId;
	}
	else if( $(this).hasClass("exp") ){
		instId  = splitArr[1]+'_'+splitArr[2]+'_'+splitArr[3]+'_'+splitArr[4]+'_';
		uniqeId = getUniqueIdForJsmol(instId);
		
		if( $(this).parent().parent().hasClass("all_instncs") ){
			jmolId = 'allinst_e'+uniqeId
		}
		else{
			jmolId = 'e'+uniqeId;
		}
	}
	atomNm = $(this).attr('value');
	jmolCmd =  "zoomTo (*."+atomNm+") 300; background LABELS [xF8F8FF]; select (*."+atomNm+"); label '%a';"
	var jmolVwr = jsmolAppDict[jmolId];
	Jmol.script( jmolVwr, jmolCmd );
	
});
$(document).on('click','.inneraccordion .head', function(){
	var ele = $(this).find('span:first');
	//alert('Captured click');
	ele.toggleClass('ui-icon-circle-arrow-s ui-icon-circle-arrow-e');
	$(this).next().toggle('slow');
	applyBeautyTips();
	return false;
});
$(document).on('click','.reload_jmol.exp', function(){
	var thisBtn = $(this);
	var btnName = thisBtn.attr('name');
	var btnRequest = thisBtn.attr('value');
	var splitArr = btnName.split('_');
	var instId  = splitArr[2]+'_'+splitArr[3]+'_'+splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6];
	var aivwToken = '';
	var uniqeId = getUniqueIdForJsmol(instId);
	var jmolId = 'e'+uniqeId;
	if( thisBtn.hasClass('aivw') ){
		aivwToken = 'aivw_';
		jmolId = 'allinst_e'+uniqeId
	}
	var threeD_environ_frm = '#threeD_environ_vw_'+aivwToken+instId+'_frm';
	var pthCoordFileStandAlone = $(threeD_environ_frm+' #3dpath_standalone_'+aivwToken+instId).val();
	var jmolCmd = "load "+pthCoordFileStandAlone+"_model.cif; labels off; set showHydrogens FALSE; background [xD3D3D3];";
	var jmolVwr = jsmolAppDict[jmolId];
	Jmol.script( jmolVwr, jmolCmd );
});
$(document).on('click','.reload_jmol.ref', function(){
	var thisBtn = $(this);
	var btnName = thisBtn.attr('name');
	var btnRequest = thisBtn.attr('value');
	var splitArr = btnName.split('_');
	var grpId = splitArr[6];
	var instId  = splitArr[2]+'_'+splitArr[3]+'_'+splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6];
	var uniqeId = getUniqueIdForJsmol(instId);
	var jmolId = 'r'+uniqeId+grpId;
	var reload_frm = '#reload_jmol_'+instId+grpId+'_frm';
	var pthCoordFile = $(reload_frm+' #3dpath_'+instId+grpId).val();
	var jmolCmd = "load "+pthCoordFile+"_ideal.cif; labels off; set showHydrogens FALSE; background [xD3D3D3];";
	var jmolVwr = jsmolAppDict[jmolId];
	Jmol.script( jmolVwr, jmolCmd );
});
//function limitChars(textid, limit, infodiv){
function limitChars(textid, limit){
	var text = $('#'+textid).val();
	var textlength = text.length;
	if(textlength > limit){
		alert('Assigned IDs cannot be more than '+limit+' characters!');
		$('#'+textid).val(text.substr(0,limit));
		return false;
	}
	else{
		//$('#' + infodiv).html('You have '+ (limit - textlength) +' characters left.');
		return true;
	}
}
$(document).on('click','.threeD_environ_vw_btn.type1', function(){
	var thisBtn = $(this);
	var btnName = thisBtn.attr('name');
	var btnRequest = thisBtn.attr('value');
	var splitArr = btnName.split('_');
	var grpId = splitArr[6];
	var instId  = splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6]+'_'+splitArr[7]+'_'+splitArr[8];
	//alert("button clicked and instId is: "+instId);
	var aivwToken = '';
	var bIsAllInstVw = false;
	if( thisBtn.hasClass('aivw') ){
		aivwToken = 'aivw_';
		bIsAllInstVw = true;
	}
	var bIsNoMatchCndtn = false;
	if( thisBtn.hasClass('nomatch') ){
		bIsNoMatchCndtn = true;
	}
	var uniqeId = getUniqueIdForJsmol(instId);
	var threeD_environ_frm = '#threeD_environ_vw_'+aivwToken+instId+'_frm';
	var pthCoordFileEnviron = $(threeD_environ_frm+' #3dpath_environ_'+aivwToken+instId).val();
	var pthCoordFileStandAlone = $(threeD_environ_frm+' #3dpath_standalone_'+aivwToken+instId).val();
	//alert("pthCoordFileEnviron: "+pthCoordFileEnviron);
	var residueNum = $(threeD_environ_frm+' #residue_num_'+aivwToken+instId).val();
	var chainId = $(threeD_environ_frm+' #chain_id_'+aivwToken+instId).val();
	//alert("residueNum and chainId: "+residueNum+" and "+chainId);
	var jmolId;
	var threeDdivElemLocator;
	if( bIsAllInstVw ){
		threeDdivElemLocator = '#allinst_threeD_' + instId;
		jmolId = 'allinst_e'+uniqeId;
	}
	else{
		threeDdivElemLocator = '#threeD_' + instId;
		jmolId = 'e'+uniqeId;
	}
	var jmolVwr = jsmolAppDict[jmolId];
	var jmolCmd;
	if( btnRequest == 'Environment View' ){
		jmolCmd = "load "+pthCoordFileEnviron+".cif; background [xD3D3D3]; wireframe only; wireframe 0.05; labels off; slab 100; depth 40; slab on; display within(6.0, "+residueNum+":"+chainId+"); zoomto ("+residueNum+":"+chainId+") 800; select ("+residueNum+":"+chainId+"); wireframe only; wireframe 0.10; spacefill 15%; label '%a';";
		thisBtn.attr('value','Stand-Alone View');
		$('#btn_lbls_on_off_'+aivwToken+instId).show();
		Jmol.script( jmolVwr, jmolCmd );
		if( bIsAllInstVw ){
			$('#atm_mp_chck_bx_'+grpId).hide().prev('label').hide();
		}
		else{
			$('#atm_mp_chck_bx_'+instId).hide().prev('label').hide();
		}
	}
	else if( btnRequest == 'Stand-Alone View' ){
		jmolCmd = "load "+pthCoordFileStandAlone+"_model.cif; labels off; set showHydrogens FALSE; background [xD3D3D3];";
		thisBtn.attr('value','Environment View');
		$('#btn_lbls_on_off_'+aivwToken+instId).hide();
		Jmol.script( jmolVwr, jmolCmd );
		var localEnvironVwStillShown = false;
		if( bIsAllInstVw ){
			$('.threeD_environ_vw_btn.lbls_on_off.aivw','#instance_data_'+grpId).each( function() {
				if( $(this).is(":visible") ){
					localEnvironVwStillShown = true;
				}
			});
			if( !localEnvironVwStillShown ){
				$('#atm_mp_chck_bx_'+grpId).show().prev('label').show();
			}
		}
		else{
			$('#atm_mp_chck_bx_'+instId).show().prev('label').show();
		}
	}
});
$(document).on('click','.threeD_environ_vw_btn.lbls_on_off', function(){
	var thisBtn = $(this);
	var btnName = thisBtn.attr('name');
	var btnRequest = thisBtn.attr('value');
	var splitArr = btnName.split('_');
	var instId  = splitArr[4]+'_'+splitArr[5]+'_'+splitArr[6]+'_'+splitArr[7]+'_'+splitArr[8];
	var uniqeId = getUniqueIdForJsmol(instId);
	var jmolId;
	var aivwToken = '';
	if( thisBtn.hasClass('aivw') ){
		aivwToken = 'aivw_';
		jmolId = 'allinst_e'+uniqeId;
	}
	else{
		jmolId = 'e'+uniqeId;
	}
	var threeD_environ_frm = '#threeD_environ_vw_'+aivwToken+instId+'_frm';
	var residueNum = $(threeD_environ_frm+' #residue_num_'+aivwToken+instId).val();
	var chainId = $(threeD_environ_frm+' #chain_id_'+aivwToken+instId).val();
	var viewerCmd;
	var jmolVwr = jsmolAppDict[jmolId];
	if( btnRequest == "Labels Off" ){
		thisBtn.attr('value','Labels On');
		viewerCmd = "label off;";
		Jmol.script( jmolVwr, viewerCmd );
	}
	else{
		thisBtn.attr('value','Labels Off');
		viewerCmd = "select ("+residueNum+":"+chainId+"); label '%a';";
		Jmol.script( jmolVwr, viewerCmd );
	}
});

$(document).on('click','.twoD_labld_vw_btn', function(){
	var $thisBtn = $(this);
	var pathToImgFile = $thisBtn.attr('name');
	var btnId = $thisBtn.attr('id');
	var refType = false;
	var instId = '';
	var descr = '';
	var diagType = '';
	var identifier = '';
	
	if( btnId.indexOf('no_hy_') > 0 ){
		diagType = 'no_hy_';
	}else{
		diagType = 'w_hy_';
	}
	
	if( $thisBtn.hasClass("ref") ){
		refType = true;
	}
	
	identifier = btnId.split('twoD_labld_vw_'+diagType)[1];
	
	if( refType ){	
		var idSplitArr = identifier.split('--');
		instId = idSplitArr[0];
		var refCcId = idSplitArr[1];
	}else{
		instId = identifier;
	}
	
	if( diagType == 'no_hy_'){
		descr = '';
	}else{
		descr = '  -  w/ Hydrogen Labels';
	}
	
	$('#twoD_labld_vwr_'+diagType+identifier).html('<h3>'+( refType ? refCcId : instId )+descr+'</h3><img src="'+pathToImgFile+'"  height="85%" width="92%">').dialog({width: 650, height:700});		
});

$(document).on('click','.sdf_vw_btn', function(){
	var $thisBtn = $(this);
	var btnId = $thisBtn.attr('id');
	var grpId = btnId.split('sdf_vw_btn_')[1];
	
	$('#sdf_vwr_'+grpId).dialog({width: 650, height:700});		
});

$(document).on('click','.dscrptr_vw_btn', function(){
	var $thisBtn = $(this);
	var btnId = $thisBtn.attr('id');
	var grpId = btnId.split('dscrptr_vw_btn_')[1];
	
	$('#dscrptr_vwr_'+grpId).dialog({width: 650, height:700});		
});


$(document).on('keyup','input.add_new_candidate:text', function(event){
	var addNonCandTxtBxId = $(this).attr('id');
	var instId = $(this).attr('name');
	limitChars(addNonCandTxtBxId, 3);
	if(event.keyCode == 13){
	    //$('add_new_candidate_frm_'+instId).submit();
	}
});
function getNewCandidate(newCandidateFrm,hitList,candiList){
	var instId = $('input[name=instanceid]',newCandidateFrm).val();
	var refId = ($('input[name=ccid]',newCandidateFrm).val()).toUpperCase();
	var tblLctr = '#'+instId+'_t';
	newCandidateFrm.ajaxSubmit({url: getNewCandidateUrl, async: true, clearForm: false,
                beforeSubmit: function (formData, jqForm, options) {
                   formData.push({ 'name' : 'displayhitlist', 'value' : hitList });
                   formData.push({ 'name' : 'displaycandidatelist', 'value' : candiList });
                }, success: function(jsonObj) {
        	var status = jsonObj.statuscode;
        	if( status == '0' ){
        		toggleChemCompDisplay(instId,refId,SNGL_INSTNC,true);
    			$('input[name=ccid]',newCandidateFrm).val('');
    			$(tblLctr+" tr.add_new_candidate").show();
            	$(tblLctr+' tr:last').after('<tr><td class="entityid"><a href="/ccmodule/cc-view.html?ccid='+refId+'" target="_blank">'+refId+'</a></td><td class="assignas_rdio_btn">Must Force Assign</td><td class="score">n.a.</td><td class="vizcmp_chck_bx"><input id="viz_cmp_'+instId+'_'+refId+'" name="'+instId+'" class="vizcmp_chck_bx" type="checkbox" value="'+refId+'" checked="checked"></td></tr>');
                        refreshInstImages(instId);
        	}
        	else{
        		if( status == '1'){
            		alert('"'+refId+'" is already available for comparison as a top candidate.');
            	}
            	if( status == '2'){
            		alert('"'+refId+'" has already been provided as a new candidate for comparison.');
            	}
            	if( status == '-1'){
            		alert('An error has occurred in retrieving data for "'+refId+'"');
            	}
        	}
        }
    });
    return false;	
}
$(document).on('submit','form.add_new_candidate', function(event){
	event.preventDefault();
	var $this = $(this);
	var instId = $('input[name=instanceid]',$this).val();
        var hitList = '';
        $('input[name=assign_' + instId + ']').each(function() {
            if (hitList.length > 0) hitList += ',';
            hitList += $(this).val();
        });
        var candiList = '';
        $('input[name=' + instId + ']', '#'+instId+'_t').each(function() {
            if (candiList.length > 0) candiList += ',';
            candiList += $(this).val();
        });
	var newCandId = ($('input[name=ccid]',$this).val()).trim().toUpperCase();
	$('input[name=ccid]',$this).val(newCandId);
	//$('input[name=ccid]',$this).attr('disabled','disabled');
	if( newCandId.length > 0 ){
	        $('span.prcssng_msg',$this).show();
		var dataToSend = $this.serialize();
		//dataToSend += '&ccid='+newCandId+'&vldtmode=simple';
		dataToSend += '&vldtmode=simple';
		$.ajax({type: 'POST', url: validateCcIdUrl, async: true,
			   data: dataToSend,
			   success: function(jsonObj) {
                                  if (jsonObj.errorflag) {
                                       alert(jsonObj.errortext);
                                  } else {
	                	       getNewCandidate($this,hitList,candiList);
	                 	  }
	                   }
		});
		//$('input[name=ccid]',$this).removeAttr('disabled');
		$('span.prcssng_msg',$this).hide();
	} else alert('Please input chemcal component ID');
});
//////////////////////END: EVENT HANDLERS - Instance Search View //////////////////////////////////////////////////////
