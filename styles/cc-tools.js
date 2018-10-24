/*
 *  File: cc-tools.js
 */

function js_jmol_script_send(command,suffix) {
  jmolScript(command,suffix);
  /*  var applet=_jmolGetApplet();
   *if (applet) ret += applet.script(command);
   */

}

function js_jmol_display_hydrogens(obj,suffix) {
  var command;
  if (obj.checked) {
    command = "set showhydrogens on;";
  } else {
    command = "set showhydrogens off;";
  }
  js_jmol_script_send(command,suffix);
}


function js_jmol_display_atom_labels(obj,suffix) {
  var command;
  if (obj.checked) {
    command = "label %a;";
  } else {
    command = "label OFF;";
  }
  js_jmol_script_send(command,suffix);
}

