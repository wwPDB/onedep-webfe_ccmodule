/*
 * File: cc-marvin-sketch.js
 * Date: 16-Aug-2010
 *
 */
 

function getFormat() {
    var sel = document.MyExportForm.molformat;
    var v = document.MyExportForm.molformat[sel.selectedIndex].value;
    if (v == "cif") {
       v = "mol:-a+H";	
    }		
    return v;
}

function undo() {
    if(document.MSketch != null) {
        document.MSketch.undo();
    }
}

function redo() {
    if(document.MSketch != null) {
        document.MSketch.redo();
    }
}

function myImportMol(s,opts) {
	if(document.MSketch != null) {
		//var s = document.MolForm.MolTxt.value;
		document.MSketch.setMol(s, opts);
	} else {
		alert("Cannot import molecule:\n"+
		      "no JavaScript to Java communication in your browser.\n");
	}
}

function myExportMol(format) {
	if(document.MSketch != null) {
		var s = document.MSketch.getMol(format);
		s = unix2local(s); // Convert "\n" to local line separator
		document.MyExportForm.MolData.value = s;
	} else {
		alert("Cannot import molecule:\n"+
		      "no JavaScript to Java communication in your browser.\n");
	}
}

function mySearchMol(format) {
	if(document.MSketch != null) {
		var s = document.MSketch.getMol(format);
		s = unix2local(s); // Convert "\n" to local line separator
		document.MySearchForm.MolData.value = s;
	} else {
		alert("Cannot import molecule:\n"+
		      "no JavaScript to Java communication in your browser.\n");
	}
}

function launchSketcherFile(format,filePath) {
	msketch_name = "MSketch";	
	msketch_begin("/applets/marvin", 500, 500);
	msketch_param("background", "#99ccff");		
	msketch_param("molbg", "#eeeeee");
	msketch_param("colorscheme", "cpk");		
	msketch_param("preload", "MolExport,Parity,SmilesExport,Clean2D,Clean3D,PdbImport");
	msketch_param("autoscale", "true");	
	msketch_param("implicitH", "all");		
	msketch_param("explicitH", "true");		
	msketch_param("imgConv", "+Hc-a");
	msketch_param("clean2dOpts", "O2");
	msketch_param("clean3dOpts", "S{fine}");
	msketch_param("cleanDim", "3");
	msketch_param("chiralitySupport", "all");
	msketch_param(format,filePath);
	msketch_end();
}

function launchSketcher1(size) {
	msketch_name = "MSketch";	
	msketch_begin("/applets/marvin", size, size);
	msketch_param("background", "#99ccff");		
	msketch_param("molbg", "#eeeeee");
	msketch_param("colorscheme", "cpk");		
	msketch_param("preload", "MolExport,Parity,SmilesExport,Clean2D,Clean3D,PdbImport");
	msketch_param("autoscale", "true");	
	msketch_param("implicitH", "all");		
	msketch_param("explicitH", "true");		
	msketch_param("imgConv", "+Hc-a");
	msketch_param("clean2dOpts", "O2");
	msketch_param("clean3dOpts", "S{fine}");
	msketch_param("cleanDim", "3");
	msketch_param("chiralitySupport", "all");
	msketch_end();
}
