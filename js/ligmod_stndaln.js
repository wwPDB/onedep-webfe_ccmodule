/***********************************************************************************************************
File:		ligmod_stndaln.js
Author:		rsala (rsala@rcsb.rutgers.edu)
Date:		2011-04-06
Version:	0.0.1

JavaScript supporting Standalone Ligand Module web interface 

2010-04-06, RPS: Created with ligmod.js as starter template
2011-06-07, RPS: Accommodating standalone LigTool UI feature for seeing more/less of the chem comp subheader textual data.
2011-06-08, RPS: Correcting behavior for properly showing/hiding 2D display on addition of new components to compare grid.
2011-06-14, RPS: Improving handling of showing/hiding additional chem comp textual header information in comparison grid.
2011-06-23, RPS: service URL reorganization.
2011-11-01, RPS: addressed bug allowing redundant display of chem components in comparitive panel of "View" page.
2011-11-11, RPS: Some relative URL values updated to reflect consolidated deployment of all common tool front-end modules.
2011-12-08, RPS: Code cleanup, including consolidation of redundant code into toggleChemCompDisplay() function.
2011-12-13, RPS: Added support for removing chem components from the comparison display grid.
2011-12-22, RPS: More URL updates to reflect consolidated deployment of all common tool front-end modules.
2012-01-18, RPS: Updated to provide different layout handling for displaying one chem component versus displaying many chem components.
				 Also fixed problem with Show More/Less feature so that page is not rescrolled to top when this feature is used.
2013-06-26, RPS: Updated to reflect updates to server-side chem component ID validation.
2014-02-19, RPS: Updated to replace Jmol with Jsmol (which involved update in jQuery core and jQuery UI libraries, and hence removal of ".live" binding syntax.
2014-11-19, RPS: Updated to use latest version of jsmol
2015-10-21, RPS: Parameterizing for desired version of jsmol. Removed obsolete references to js paginate plugin.
*************************************************************************************************************/
var jsmolAppOpen={};
var jsmolAppDict={};
var JMOL_VRSN = 'jmol-latest';

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
}

function loadFileJsmol(appName, id, filePath, jmolMode) {
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

$(document).ready(function() {	
    var SESSION_ID;
    var CC_IDS_REQD = new Array();
    var AJAX_TIMEOUT = 60000;
    var ADMIN_CONTACT = 'Send comments to: <a href="mailto:jwest@rcsb.rutgers.edu">help@wwpdb-dev.rutgers.edu</a>';
    var INFO_STYLE = '<span class="ui-icon ui-icon-info fltlft"></span> ';
	var ERR_STYLE = '<span class="ui-icon ui-icon-alert fltlft"></span> ';
    var DEBUG = false;
    var MORE_TEXT = "+  See More";
	var LESS_TEXT = "- See Less";
	var bSHOW_MORE_ON_CLICK = true;
	var ACTIVE_CCID = 1;
    //var URL_VIEW_CHEM_COMP = '/service/cc/view_chem_comp';
    var URL_VIEW_CHEM_COMP = '/service/cc/view';
    var URL_VALIDATE_CCID = '/service/cc/assign/validate_ccid';
    
	$(document).ajaxError(function(e, x, settings, exception) {
        try {
            if (x.status == 0) {
                $('.errmsg.glblerr').html(ERR_STYLE + 'You are offline!!<br />Please Check Your Network.').show().fadeOut(4000);
            } else if (x.status == 404) {
                $('.errmsg.glblerr').html(ERR_STYLE + 'Requested URL "' + settings.url + '" not found.<br />').show().fadeOut(4000);
            } else if (x.status == 500) {
                $('.errmsg.glblerr').html(ERR_STYLE + 'Internel Server Error.<br />').show().fadeOut(4000);
            } else if (e == 'parsererror') {
                $('.errmsg.glblerr').html(ERR_STYLE + 'Error.\nParsing JSON Request failed.<br />').show().fadeOut(4000);
            } else if (e == 'timeout') {
                $('.errmsg.glblerr').html(ERR_STYLE + 'Request Time out.<br />').show().fadeOut(4000);
            } else {
                $('.errmsg.glblerr').html(ERR_STYLE + x.status + ' : ' + exception + '<br />\n').show().fadeOut(4000);
            }
        } catch (err) {
			$('.loading').hide();
            var errtxt = 'There was an error while processing your request.\n';
            errtxt += 'Error description: ' + err.description + '\n';
            errtxt += 'Click OK to continue.\n';
            alert(errtxt);
        }
    });
	$.ajax({url: '/ccmodule/js/jquery/ui-src/jquery-ui-1.10.3.custom.min.js', async: false, dataType: 'script'});
    $.ajax({url: '/js/jquery/plugins/jquery.form.min.js', async: false, dataType: 'script'});
    $.ajax({url: '/applets/'+JMOL_VRSN+'/jsmol/JSmol.min.nojq.js', async: false, dataType: 'script'});
    $.ajax({url: '/js/jquery/plugins-src/jquery.bt.v097.min.js', async: false, dataType: 'script'});
    
    ///////////////////////////////////////////BEGIN: CHECK FOR CCID REQUEST FROM PRIOR PAGE //////////////////////////////////////////////////
    /*
     * Below we are checking for whether we've arrived at this page via link from any search results
     * where a querystring parameter would have been passed for the chem comp ID to be viewed 
     */
    var ccid = getQuerystring('ccid');
    if( ccid.length > 1 && typeof(ccid) != "undefined"){
    	var chemCompId = ccid.toUpperCase();
    	$('span.prcssng_msg','#add_chemcomp_frm').show();
		var splitArr = chemCompId.split(' ');
		var ccId;
		for( var i = 0; i < splitArr.length; i++){
			ccId = splitArr[i];
			if( ccId.length > 0 ){
				var dataToSend = 'ccid='+ccId+'&vldtmode=simple';
				$.ajax({type: 'GET',url: URL_VALIDATE_CCID, async: false,
					   data: dataToSend,
					   success: function(jsonObj) {
							if (jsonObj.errorflag) {
								alert(jsonObj.errortext);
							}else{
								$('#viz_compare').show();
			                	getChemComp(ccId);
		                	}			                
			            }
				});
				$('span.prcssng_msg','#add_chemcomp_frm').hide();
			}
		}
    }
    /////////////////////////////////////////////END: CHECK FOR CCID REQUEST FROM PRIOR PAGE //////////////////////////////////////////////////
    
    ///////////////////// FUNCTION DEFINITIONS ///////////////////////////////////////////
	function closeWindow() {
        //uncomment to open a new window and close this parent window without warning
        //var newwin=window.open("popUp.htm",'popup','');
        if(navigator.appName=="Microsoft Internet Explorer"){
            this.focus();self.opener = this;self.close(); 
        } else {
                window.open('','_parent',''); window.close(); 
        }
    }
    String.prototype.startsWith = function (str){
    	return this.indexOf(str) == 0;
    };
    function getSessPathPrefix(){
    	return '/sessions/'+SESSION_ID;
    }
    function getQuerystring(key, default_)
    /*************************************************************
	 * get query string parameter if any exist
	 *************************************************************/
    {
      if (default_==null) default_="";
      key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
      var regex = new RegExp("[\\?&]"+key+"=([^&#]*)");
      var qs = regex.exec(window.location.href);
      if(qs == null)
        return default_;
      else
        return qs[1];
    }
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
	function showMoreCcHeaderInfo(){
		/*************************************************************
		 * function to display extra header info for chem components
		 *************************************************************/
		$('.viz_compare_subhdr a.show_more_less').text(LESS_TEXT);
		$("tr.more_less").show();
		//$("p.continued").hide();
		bSHOW_MORE_ON_CLICK = false;
	}
	function showLessCcHeaderInfo(){
		/*************************************************************
		 * function to hide extra header info for chem components
		 *************************************************************/
		$('.viz_compare_subhdr a.show_more_less').text(MORE_TEXT);
		$("tr.more_less").hide();
		//$("p.continued").show();
		bSHOW_MORE_ON_CLICK = true;
	}
	function adjstDsplyForSnglVsMny()
	{
		var numChemCompsShown = $('#chemcomp_vwr_data').find('li:visible').length;
		if( numChemCompsShown == 1 ){
			$('#chemcomp_vwr_data').find('li:visible').removeClass("fltlft").find('div').addClass("fltlft");
		}else if( numChemCompsShown == 2 ) $('#chemcomp_vwr_data').find('li:visible').addClass("fltlft").find('div').removeClass("fltlft");
		
	}
	function toggleChemCompDisplay(sRefId,bShow){
		/*************************************************************
		 * function responsible for showing/hiding profile for given
		 * chem comp ID in comparison grid. 
		 *************************************************************/
		var ulElemLocator = ' #chemcomp_vwr_data';
		var liElemUrl = getSessPathPrefix() +'/'+sRefId+'/'+sRefId+'_viz_cmp_li.html';
		var liElemLocator = ' #vizcmp_' + sRefId;
		var thisLiElem = $(liElemLocator);
		if( thisLiElem.length == 0 ){
			$.get(liElemUrl, function(data) { 
				$(ulElemLocator).append(data);
				var twoDchecked = $('#twoD_chck_bx').prop("checked");
				var threeDchecked = $('#threeD_chck_bx').prop("checked");
				var twoDdivElemLocator = liElemLocator + ' div.twoDviz';
				var threeDdivElemLocator = liElemLocator + ' div.threeDviz';
				var jmolHtmlUrl = getSessPathPrefix() +'/'+sRefId+'/'+sRefId+'_ref_jmol.html';
				$(twoDdivElemLocator).css('display', twoDchecked ? 'block' : 'none');
				
				if(threeDchecked){
					$(threeDdivElemLocator).each( function(n) {
						
						refCcId = $(this).attr('name');
						jmolHtmlUrl = getSessPathPrefix() +'/'+refCcId+'/'+refCcId+'_ref_jmol.html';
						loadFilePath = getSessPathPrefix() +'/'+refCcId+'/report/'+refCcId+'_ideal.cif';
						refThreeDdivId = $(this).attr('id');
						
						//invoke jsmol for dictionary reference
						if( !($('#dicr'+refCcId+'_appletinfotablediv').length ) ) {
							
							loadFileJsmol('dicr'+refCcId,refThreeDdivId,loadFilePath,"default");
							$('#dicr'+refCcId+'_appletinfotablediv').css({'padding-left':'0px', 'border-style':'none'});
							$('#dicr'+refCcId+'_appletdiv').css({'padding-left':'0px', 'border-style':'none'});
							$.get(jmolHtmlUrl, function(data){
								$("#"+refThreeDdivId).append(data);
							}, "html");
						}

					});
					$(threeDdivElemLocator).css('display', 'block');
				}
				else{
					$(threeDdivElemLocator).css('display', 'none');
				}
				/**
				if( $(threeDdivElemLocator).length < 100 ){
					$(threeDdivElemLocator).load(jmolHtmlUrl, function(){
						$(threeDdivElemLocator).css('display', threeDchecked ? 'block' : 'none');
					});
				}
				***/
				
				//////////////////In block below we are accommodating feature for seeing more/less of the chem comp subheader fields////////////////
				if( bSHOW_MORE_ON_CLICK ){
					//The boolean checked above represents desired behavior on next 
					//*user* click. So if *true*, means that current display state of
					//extra header info is hidden, so we hide the extra header info 
					//to agree with current state
					showLessCcHeaderInfo();
				}
				else{
					//The boolean checked above represents desired behavior on next 
					//*user* click. So if *false*, means that current display state of
					//extra header info is shown, so we show the extra header info 
					//to agree with current state
					showMoreCcHeaderInfo();
				}
				/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				adjstDsplyForSnglVsMny();
			}, "html");
		}
		thisLiElem.css('display', bShow ? 'block' : 'none');
		adjstDsplyForSnglVsMny();
	}
	function getChemComp(refId){
		/*************************************************************
		 * obtain data for given chem component ID to be displayed
		 * in comparison grid 
		 *************************************************************/
		var tblLctr = '#cc_view_tbl';
		var dataToSend = 'ccid='+refId;
		if( typeof(SESSION_ID) != "undefined" && SESSION_ID.length > 0 ){
			dataToSend += '&sessionid='+SESSION_ID;
		}
		//$('#add_chemcomp_frm').ajaxSubmit({url: URL_VIEW_CHEM_COMP, async: false, clearForm: false,  data: dataToSend,
		$.ajax({type: 'GET', url: URL_VIEW_CHEM_COMP, async: false, data: dataToSend,
			success: function(jsonObj) {
				//alert("in getChemComp success function.");
				SESSION_ID = jsonObj.sessionid;
				//alert('Session ID on return from form submission is: '+SESSION_ID);
				var sessPathPrefix = getSessPathPrefix();
				var status = jsonObj.statuscode;
            	if( status == '0' ){
            		toggleChemCompDisplay(refId,true);
	    			$('input[name=ccid]','#add_chemcomp_frm').val('');
	    			$(tblLctr).show();
	            	$(tblLctr+' tr:last').after('<tr><td class="ccid">'+refId+'</a></td><td class="downloads"><a href="'+
	            			sessPathPrefix+'/'+refId+'/report/'+refId+'.cif" target="_blank">Component Definition (CIF)</a></td><td class="downloads"><a href="'+
	            			sessPathPrefix+'/'+refId+'/report/'+refId+'_D3L0.gif" target="_blank">Chemical diagram</a></td><td class="downloads"><a href="'+
	            			sessPathPrefix+'/'+refId+'/report/'+refId+'_D3L1.gif" target="_blank">Chemical diagram w/ heavy atom labels</a></td><td class="hydrgn_atm_lbls"><a href="'+
	            			sessPathPrefix+'/'+refId+'/report/'+refId+'_D3L3.gif" target="_blank">Chemical diagram w/ hydrogen atom labels</a></td><td class="vizcmp_chck_bx"><input id="viz_cmp_'+
	            			refId+'" name="'+refId+'" class="vizcmp_chck_bx" type="checkbox" value="'+
	            			refId+'" checked="checked"></td><td class="rmv_btn"><input style="display: inline;" id="rmv_chemcomp_btn_'+
	            			refId+'" name="'+refId+'" value="Remove" class="rmv_chemcomp fltlft" type="button"></td></tr>');
            	}
            	else{
            		if( status == '1'){
                		alert('"'+refId+'" is already available for comparison as a top candidate.');
                	}
                	if( status == '2'){
                		alert('"'+refId+'" has already been provided as a non-candidate for comparison.');
                	}
                	if( status == '-1'){
                		alert('An error has occurred in retrieving data for "'+refId+'"');
                	}
            	}
            }
        });
        return false;	
	}
    function alrdyRqstd(ccId){
    	/*************************************************************
		 * check if chem component ID has already been  
		 * requested for display in the comparison grid
		 *************************************************************/
    	bExists = false;
    	for( var i=0; i < CC_IDS_REQD.length; i++){
    		if ( CC_IDS_REQD[i] == ccId ){
    			bExists = true;
    			alert(ccId+" has already been requested for comparison display.")
    		}
    	}
    	return bExists;
    }
    function clearRqstd(ccId){
    	/*************************************************************
		 * clear chem component ID from the comparison grid
		 *************************************************************/
    	for( var i=0; i < CC_IDS_REQD.length; i++){
    		if ( CC_IDS_REQD[i] == ccId ){
    			CC_IDS_REQD.splice(i,1);
    		}
    	}
    	if( CC_IDS_REQD.length == 0){
    		$('#viz_compare').hide();
    		$('#cc_view_tbl').hide();
    	}
    		
    }
	//////////////////// EVENT HANDLERS //////////////////////////////////////////////////////
    $(document).on('click','.viz_compare_subhdr a.show_more_less', function(){
		/*************************************************************
		 * click event handler for handling display/hiding of extra 
		 * textual header fields for chem components in comparison grid
		 *************************************************************/
		if( bSHOW_MORE_ON_CLICK ){
			showMoreCcHeaderInfo();
		}
		else{
			showLessCcHeaderInfo();
		}
		return false;
	});
    $(document).on('click','.rmv_chemcomp', function(){
		var refid = $(this).attr('name');
		var liElemLocator = ' #vizcmp_' + refid;
		$(this).parent().parent('tr').remove();
		$(liElemLocator).remove();
		clearRqstd(refid);
		adjstDsplyForSnglVsMny();
	});
    $(document).on('click','.cc_view_tbl .vizcmp_chck_bx', function(){
		//alert('Captured click event');
		var checked = $(this).prop("checked");
		var refid = $(this).attr('value');
		toggleChemCompDisplay(refid,checked);
		adjstDsplyForSnglVsMny();
	});
    $(document).on('click','.threeD_chck_bx', function(){
		//alert('Captured click event');
		var checked = this.checked;
		var ulElemLocator = ' #chemcomp_vwr_data';
		var threeDdivElemLocator = ulElemLocator + ' div.threeDviz';
		var reloadJmolBtnLctr = ulElemLocator + ' input.reload_jmol';
		var jmolHtmlUrl;
		var refid;
		
		if(checked){
			$(threeDdivElemLocator).each( function(n) {
				refCcId = $(this).attr('name');
				jmolHtmlUrl = getSessPathPrefix() +'/'+refCcId+'/'+refCcId+'_ref_jmol.html';
				loadFilePath = getSessPathPrefix() +'/'+refCcId+'/report/'+refCcId+'_ideal.cif';
				refThreeDdivId = $(this).attr('id');
				
				//invoke jsmol for dictionary reference
				if( !($('#dicr'+refCcId+'_appletinfotablediv').length ) ) {
					
					loadFileJsmol('dicr'+refCcId,refThreeDdivId,loadFilePath,"default");
					$('#dicr'+refCcId+'_appletinfotablediv').css({'padding-left':'0px', 'border-style':'none'});
					$('#dicr'+refCcId+'_appletdiv').css({'padding-left':'0px', 'border-style':'none'});
					$.get(jmolHtmlUrl, function(data){
						$("#"+refThreeDdivId).append(data);
					}, "html");
				}

			});
			$(threeDdivElemLocator).css('display', 'block');
		}
		else{
			$(threeDdivElemLocator).css('display', 'none');
		}
	});
    $(document).on('click','.twoD_chck_bx', function(){
		var checked = this.checked;
		var ulElemLocator = ' #chemcomp_vwr_data';
		var twoDdivElemLocator = ulElemLocator + ' div.twoDviz';
		$(twoDdivElemLocator).css('display', checked ? 'block' : 'none');
	});
    $(document).on('click','.reload_jmol.ref', function(){
		var thisBtn = $(this);
		var btnName = thisBtn.attr('name');
		var btnRequest = thisBtn.attr('value');
		var splitArr = btnName.split('_');
		var grpId = splitArr[6];
		var instId  = splitArr[2]+'_'+splitArr[3]+'_'+splitArr[4]+'_'+splitArr[5]+'_';
		var jmolId = 'jmolApplet_'+instId+grpId;
		var reload_frm = '#reload_jmol_'+instId+grpId+'_frm';
		var pthCoordFile = $(reload_frm+' #3dpath_'+instId+grpId).val();
		var jmolCmd;
		jmolCmd = "load "+pthCoordFile+"_ideal.cif; labels off; set showHydrogens FALSE; background [xD3D3D3];";
		var jmolVwr = eval("document."+jmolId);
		jmolVwr.script(jmolCmd);
    });

    $(document).on('keyup','input.add_chemcomp:text', function(event){
		var addChemCompTxtBxId = $(this).attr('id');
		//limitChars(addChemCompTxtBxId, 3);
		if(event.keyCode == 13){
		    //$('#add_chemcomp_frm').submit();
		}
	});

    $(document).on('submit','#add_chemcomp_frm', function(event){
		event.preventDefault();
		var $this = $(this);
		var chemCompId = ($('input[name=ccid]',$this).val()).toUpperCase();
		chemCompId = chemCompId.replace(/\,/g,'');
		$('input[name=ccid]',$this).val(chemCompId);
		$('span.prcssng_msg',$this).show();
		var splitArr = chemCompId.split(' ');
		var ccId;
		for( var i = 0; i < splitArr.length; i++){
			ccId = splitArr[i];
			if( ccId.length > 0 && !alrdyRqstd(ccId) ){
				CC_IDS_REQD.push(ccId);
				var dataToSend = 'ccid='+ccId+'&vldtmode=simple';
				$.ajax({type: 'GET',url: URL_VALIDATE_CCID, async: false,
					   data: dataToSend,
					   success: function(jsonObj) {
							if (jsonObj.errorflag) {
								alert(jsonObj.errortext);
							}else{
								$('#viz_compare').show();
			                	getChemComp(ccId);
		                	}
			            }
				});
			}
			$('span.prcssng_msg',$this).hide();
		}
	});

    $(document).on('click','.lbls_on_off_btn', function(){
		var cmd = $(this).attr('value');
		var viewerCmd;
		var refId;
		var jmolId;
		var btnName = $(this).attr('name');
		var splitArr = btnName.split('_');
		refId = splitArr[4];
		jmolId = 'dicr'+refId;
    	if( cmd == "Labels Off" ){
    		$(this).attr('value','Labels On');
    		viewerCmd = "label off;";
    	}
    	else{
    		$(this).attr('value','Labels Off');
    		viewerCmd = "label %a;";
    	}
    	
    	var jmolVwr = jsmolAppDict[jmolId];
		Jmol.script( jmolVwr, viewerCmd );
    });
    
    $(document).on('click','.show_hydrogens_btn', function(){
		var cmd = $(this).attr('value');
		var viewerCmd;
		var refId;
		var jmolId;
		var btnName = $(this).attr('name');
		var splitArr = btnName.split('_');
		refId = splitArr[2];
		jmolId = 'dicr'+refId;
    	if( cmd == "Show Hydrogens" ){
    		$(this).attr('value','Hide Hydrogens');
    		viewerCmd = "set showhydrogens on;";
    	}
    	else{
    		$(this).attr('value','Show Hydrogens');
    		viewerCmd = "set showhydrogens off;";
    	}
    	
		var jmolVwr = jsmolAppDict[jmolId];
		Jmol.script( jmolVwr, viewerCmd );
    });

});
