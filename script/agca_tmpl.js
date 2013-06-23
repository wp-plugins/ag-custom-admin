var isAGCAPage = true;
var template_name = "";						
var templates_installed = [];
var xhr =null;
var agcaLoadingTimeOut = null;

function agca_getTemplateCallback(data){										
	if(data.success == 0){
		alert(data.data);
		jQuery('#agca_template_popup').hide();
	}else{
		jQuery("#templates_name").val(template_name);
		var parts = data.data.split("||||");
		jQuery("#templates_data").val(parts[1]);	
		//console.log(jQuery("#templates_data").val());
		jQuery("body").append(parts[0]);
						
		//load settings
		agca_loadTemplateSettingsInitial(template_name);		
		
	}																			
}		

function agca_getTemplatesCallback(data){
	if(data.data == "CDbException"){
		data.data = "Service is temporary to busy. Please reload the page or try again later.";
	}									
	jQuery('#agca_templates').html(data.data);	
	jQuery('#advanced_template_options').show();										
}			
function agca_client_init(){
	agca_getLocalTemplates();
	checkIfTemplatesAreLoaded(1);
	jQuery('#agca_templates').html('<p class="initialLoader" style="font-size:18px;color:gray;font-style:italic">Loading templates...</p>');										
}

function agca_setupXHR(){									
	if(xhr != null) return false;																				
	xhr = new easyXDM.Rpc({
	remote:templates_ep
	//onReady: function () { alert('ready'); }
	}, {
		remote: {
			request: {												
			}
		},
		handle: function(data, send){
			if(data.success){													
				var callbackFname = data.url.split('callback=')[1];
				var fn = window[callbackFname];
				if(fn != undefined){
					fn(data);
				}												
			}else{
				console.log(data);													
				var url = data.url;													
				if(url !== undefined && url != ""){
					var cb = url.split('callback=')[1];
					if(cb != ""){
						var fn = window[cb];
						if(fn != undefined){
							fn(data);
						}	
					}
				}
			}					
		}	
	});
}

function agca_getTemplates(){

//agca_uploadRemoteImage('http://www.neowing.co.jp/idol_site2/image/FDGD-21/fdgd-21-top.jpg');	
	agca_setupXHR();									
	xhr.request({
			url: templates_ep + "service/client" + "?callback=agca_getTemplatesCallback",
			method: "POST",														
			callBack: agca_getTemplatesCallback,
			data: {isPost:true}
		});	
		
			
}

function agca_getConfiguration(){
	/*xhr.request({
			url: templates_ep + "/configuration" + "?callback=agca_getConfigurationCallback",
			method: "POST",														
			callBack: agca_getConfigurationCallback,
			data: {isPost:true}
		});*/
		jQuery.getJSON(templates_ep + "?callback=?",
			function(data){ 
				console.log("EP:"+data.ep);													
				templates_ep = data.ep;
				if(data.error !=""){
					jQuery('#agca_templates p.initialLoader').html(data.error);
					jQuery('#agca_templates p').removeClass('initialLoader');
					clearTimeout(agcaLoadingTimeOut);
				}else{
					agca_getTemplates();
				}													
			}
		).error(function(jqXHR, textStatus, errorThrown) {
			agca_error({url:templates_ep,data:textStatus + " " + jqXHR.responseText});
			/*console.log("error " + textStatus);
			console.log("incoming Text " + jqXHR.responseText);*/
		});
}

function agca_getTemplate(template, key){
	template_name = template;
	xhr.request({
			url: templates_ep + "service/gettemplate"+"?tmpl="+template+"&key="+key+"&callback=agca_getTemplateCallback",
			method: "POST",														
			callBack: agca_getTemplateCallback,
			data:  {isPost:true}
		});	
}

function agca_loadTemplateSettingsInitial(template){
	console.log('calb->agca_loadTemplateSettingsInitial');
	agca_loadTemplateSettingsCore(template, true);
}

function agca_loadTemplateSettings(template){		
	console.log('calb->agca_loadTemplateSettings');
	agca_loadTemplateSettingsCore(template, false);
}

function agca_loadTemplateSettingsCore(template, isInitial){
	template_name = template;
	template_selected = template;
	
	var calb = agca_getTemplateSettingsCallback;
	var calbName = "agca_getTemplateSettingsCallback";
	
	if(isInitial){
		calb = agca_getTemplateSettingsInitialCallback;
		calbName = "agca_getTemplateSettingsInitialCallback";
	}
	xhr.request({
			url: templates_ep + "service/gettemplatesettings"+"?tmpl="+template+"&key=&callback="+calbName,
			method: "POST",														
			callBack: calb,
			data:  {isPost:true}
		});
		//alert('saving template settings for template:' + template_name);
}

function agca_getTemplateSettingsInitialCallback(data){ console.log(data);
	if(data.success == 0){
		//TODO - what if template is loaded, but settings are not?
	}else{
		var settings = "";
		var filteredSettings = {};
		try{
			settings = JSON.parse(data.data);
			if(settings.length == 0){			
			}else{				
				for(var ind in settings){
					var type = settings[ind].type;														
					var text = "";					
					var defaultValue = "";
					var newItem = {};
					newItem.code = settings[ind].name;
					newItem.type = settings[ind].type;
					newItem.value = settings[ind].value;
					newItem.default_value = settings[ind].default_value;
					filteredSettings[ind] = newItem;
				}
				console.log(template_selected);			
				console.log(filteredSettings);		
				
			}
		}catch(e){
			console.log(e);
		}
		agca_saveTemplateSettingsInitial(template_selected, filteredSettings);
	}
}

function agca_getTemplateSettingsCallback(data){
	if(data.success == 0){
		//alert(data.data);
		jQuery('#agca_template_settings .agca_loader').html(data.data);
	}else{
		var settings = "";
		try{
			settings = JSON.parse(data.data);
			if(settings.length == 0){
				jQuery('#agca_template_settings .agca_loader').html("Additional settings are not available for this template");
			}else{
				jQuery('#agca_template_settings .agca_loader').hide();
				jQuery('#agca_save_template_settings').show();
				
				var currentSettings = (agca_template_settings != null && agca_template_settings != undefined)?agca_template_settings:{};
				
				//TODO: Change to use object name code object[code], instead of number object[i]
				for(var ind in settings){
					var type = settings[ind].type;														
					var text = "";
					//console.log(settings[ind]);
					var currentValue = "";				
					
					//get previously saved value
					for(var ind2 in currentSettings){
						if(currentSettings[ind2].code == settings[ind].name){
							currentValue = currentSettings[ind2].value;
						}
					}
					
					if(type==1){
						text = "<p>"+settings[ind].title+"</p><input type=\"text\" name=\"agcats_"+settings[ind].name+"\" value=\""+currentValue+"\" default_value=\""+settings[ind].default_value+"\" code=\""+settings[ind].name+"\" class=\"setting\" stype=\"1\" /></br>";															
					}else if(type==2){
						text = "<p>"+settings[ind].title+"</p><textarea name=\"agcats_"+settings[ind].name+"\" class=\"setting\"  code=\""+settings[ind].name+"\" default_value=\""+settings[ind].default_value+"\" stype=\"2\" >"+currentValue+"</textarea></br>";															
					}else if(type==3){
						text = "<p>"+settings[ind].title+"</p><select name=\"agcats_"+settings[ind].name+"\" class=\"setting\"  code=\""+settings[ind].name+"\" default_value=\""+settings[ind].default_value+"\" stype=\"3\" >";															
						var options = settings[ind].default_value.split(',');
						for(var indopt in options){
							var sel = "";
							if(currentValue == options[indopt]){
								sel = " selected=\"selected\" ";
							}
							text+="<option value="+options[indopt]+" "+sel+">"+options[indopt]+"</option>";
						}						
						text+="</select>";
					}else if(type==4){
						text = "<p>"+settings[ind].title+"</p><div class=\"agca_form_0100_div\"><input value=\""+currentValue+"\" type=\"text\" name=\"agcats_"+settings[ind].name+"\" class=\"setting agca_form_0100\"  code=\""+settings[ind].name+"\" default_value=\""+settings[ind].default_value+"\" stype=\"4\" /><input type=\"button\" name=\"agca_form_decr\" class=\"agca_form_decr\" value=\"-\"/><input type=\"button\" name=\"agca_form_incr\" class=\"agca_form_incr\" value=\"+\"/>&nbsp;(0-100)</div></br>";															
					}else if(type==6){					
						if(currentValue == true){
							currentValue =" checked=\"checked\" ";
						}else{
							currentValue="";
						}
						text = "<p>"+settings[ind].title+"</p><input type=\"checkbox\" name=\"agcats_"+settings[ind].name+"\" class=\"setting\" default_value=\""+settings[ind].default_value+"\"  code=\""+settings[ind].name+"\" stype=\"6\" "+currentValue+" /></br>";															
					}
					jQuery('#agca_template_settings').prepend(text);
					
					//TODO: do similar to options above, clean a code up a litle bit, add them dinamicaly all attributes instead of inline adding
					jQuery('.agca_form_0100_div .agca_form_decr').click(function(){
						var val =jQuery(this).parent().find('.agca_form_0100').val();
						val = parseInt(val.replace(/\D/g,''));//leave only numbers
						if(isNaN(val)) val =0;
						val--;
						if(val < 0)val =0;
						if(val > 100)val=100;
						jQuery(this).parent().find('.agca_form_0100').val(val);
					});
					jQuery('.agca_form_0100_div .agca_form_incr').click(function(){
						var val =jQuery(this).parent().find('.agca_form_0100').val();
						val = parseInt(val.replace(/\D/g,''));//leave only numbers
						if(isNaN(val)) val =0;
						val++;
						if(val < 0)val =0;
						if(val > 100)val=100;
						jQuery(this).parent().find('.agca_form_0100').val(val);
					});
					jQuery('.agca_form_0100').keyup(function(){
						
						var val =jQuery(this).val();
						val = parseInt(val.replace(/\D/g,''));//leave only numbers
						if(val < 0 || isNaN(val))val =0;
						if(val > 100)val=100;
						
						jQuery(this).val(val);
						
					});
				}				
			}
		}catch(e){
			console.log(e);
		}											
	}
	//alert('callb');
}

function agca_saveTemplateSettingsInitial(template, settings){	
	var originalText = jQuery("#templates_data").val();	
	jQuery("#templates_data").val(originalText+"|||"+JSON.stringify(settings));	
	agca_removePreviousTemplateImages();		
}



function agca_saveTemplateSettingsFromForm(template){
	template_name = template;
	
	//get settings from the form
	var settings = {};
	
	jQuery('#agca_template_settings .setting').each(function(ind){
		var setting_typ = jQuery(this).attr('stype');
		var setting_val = jQuery(this).val();
		var setting_cod = jQuery(this).attr('code');
		var setting_def = jQuery(this).attr('default_value');
		
		if(jQuery(this).attr('type')=="checkbox"){
			setting_val = jQuery(this).is(':checked');
		}
		
		settings[ind] = {
			type: setting_typ,
			value: setting_val,			
			code: setting_cod,
			default_value: setting_def
		};
		
	});
	
	jQuery('#agca_template_settings').html("<h3>Applying template settings...</h3>");
	agca_saveTemplateSettingsCore(template, settings, function(data){																				
		window.location = 'tools.php?page=ag-custom-admin/plugin.php';		
	});
}


function agca_saveTemplateSettingsCore(template, settings, callback){	
	var url = window.location;					
	jQuery.post(url,{"_agca_template_settings": JSON.stringify(settings),"_agca_current_template":template},	
	 callback
	)
	.fail(
	function(){
		console.log('AGCA Error: agca_saveTemplateSettingsCore()');
	});
}

/*function agca_saveTemplateSettingsCore(template, settings){
	var settings = {};
	var url = window.location;																				
	jQuery.post(url,{"_agca_template_settings":settings,"_agca_current_template":template},
	function(data){																				
		window.location = 'tools.php?page=ag-custom-admin/plugin.php';
		//console.log('reload');
	})
	.fail(
	function(){
		console.log('AGCA Error: agca_saveTemplateSettingsCore()');
	});
}*/


function agca_activateTemplate(template){
	var url = window.location;								
	jQuery.post(url,{"_agca_activate_template":template},
	function(data){																				
		window.location = 'tools.php?page=ag-custom-admin/plugin.php';
	})
	.fail(
	function(){
		console.log('AGCA Error: agca_activateTemplate()');
	});
}							

function agca_removeAllTemplates(){
	yesnoPopup("Are you sure? All installed templates will be removed?",agca_removeAllTemplatesConfirmed);										
}

function agca_removeAllTemplatesConfirmed(){
	window.location = 'tools.php?page=ag-custom-admin/plugin.php&agca_action=remove_templates';										
}

function handleLocalyStoredImages(){
console.log(jQuery("#templates_data").val());
	var originalText = jQuery("#templates_data").val();
	var serializedImages = "";
	for(var tag in agca_local_images){												
		if(tag != ""){
			if(serializedImages !=""){
				serializedImages+=",";
			}
			serializedImages+=agca_local_images[tag];
			originalText = originalText.replace(new RegExp(tag, 'g'), agca_local_images[tag]);										
		}											
	}										
	jQuery("#templates_data").val(originalText+"|||"+serializedImages);
	//console.log(jQuery("#templates_data").val());
	
	//save finally
	jQuery("#agca_templates_form").submit();	
}

function agca_updateInstallProgress(){
	agca_local_images_count++;
	var current = agca_remote_images_count - agca_local_images_count;
	var text = agca_local_images_count +"/" + (parseInt(agca_remote_images_count)-1);
	
	jQuery('.agca_content #activating').text('Installing ('+text+') ...');
}

function agca_removePreviousTemplateImages(){								    
	/*var url = window.location;								
	jQuery.post(url,{"_agca_remove_template_images":template_name},
		function(data){																				
		  console.log(data);									
	})
	.fail(
		function(e){
		console.log('AGCA Error: agca_removePreviousTemplateImages()');
		console.log(e);
	});*/
	
	//upload remote images on callback	
	agca_uploadRemoteImages();
}

function agca_uploadRemoteImages(){									

	var found = false;
	for(var tag in agca_remote_images){
		found = true;
		agca_updateInstallProgress();
		agca_uploadRemoteImage(agca_remote_images[tag], tag);											
		break;
	}				
	if(!found){
		jQuery('.agca_content #activating').text('Installation successful. Reloading...');
		window.setTimeout(handleLocalyStoredImages,2000);
	}
}

function agca_uploadRemoteImage(remoteUrl, tag){
	var url = window.location;								
	jQuery.post(url,{"_agca_upload_image":remoteUrl},
	function(data){																				
	console.log(data);										
	agca_local_images[tag] = data;
	delete agca_remote_images[tag];
	agca_uploadRemoteImages();
		//window.location = 'tools.php?page=ag-custom-admin/plugin.php';
	})
	.fail(
	function(){
		console.log('AGCA Error: agca_activateTemplate()');
	});
}

function agca_getLocalTemplates(){
	var url = window.location;
	jQuery.post(url,{"_agca_get_templates":true},
	function(data){										
		//console.log(data);
		templates_installed = JSON.parse(data);
		//agca_getTemplates();
		agca_getConfiguration();
		
	})
	.fail(
	function(){
		console.log('AGCA Error: agca_getLocalTemplates()');
	});
}		
function agca_error(data){										
	clearTimeout(agcaLoadingTimeOut);
	if(jQuery('#agca_templates p:first').hasClass('initialLoader')){
			jQuery('#agca_templates p:first').text('Unable to load templates. Please submit this error to AGCA support. Thank you!');										
	}
	alert('AG CUSTOM ADMIN TEMPLATE - ERROR\n\nError occured while loading configuration:\n'+data.url+'\n\n'+data.data);
}

//check if templates loaded
function checkIfTemplatesAreLoaded(pass){
	if(pass == 1){
		agcaLoadingTimeOut = window.setTimeout(function(){
		if(jQuery('#agca_templates p:first').hasClass('initialLoader')){
			jQuery('#agca_templates p:first').text('Loading, please wait...');
			checkIfTemplatesAreLoaded(2);
		}
		},6000);
		
	}else if(pass == 2){
		agcaLoadingTimeOut = window.setTimeout(function(){
		if(jQuery('#agca_templates p:first').hasClass('initialLoader')){
			jQuery('#agca_templates p:first').text('Ready in a few moments...');
			checkIfTemplatesAreLoaded(3);
		}
		},6000);
		
	}
	else if(pass == 3){
		agcaLoadingTimeOut = window.setTimeout(function(){
		if(jQuery('#agca_templates p:first').hasClass('initialLoader')){
			jQuery('#agca_templates p:first').text('This takes a bit longer than usual, please wait...');
			checkIfTemplatesAreLoaded(4);
		}
		},7000);
	}	
	else if(pass == 4){
		agcaLoadingTimeOut = window.setTimeout(function(){
		if(jQuery('#agca_templates p:first').hasClass('initialLoader')){
			jQuery('#agca_templates p:first').text('Sorry, unable to load templates right now. Please try again later.');
		}
		},10000);
	}										
}
							