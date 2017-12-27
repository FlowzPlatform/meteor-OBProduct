import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';
import SimpleSchema from 'simpl-schema';

//-------------------------------- import  Headers -------------------------------------
import { ProductInformationHeaders } from '../../lib/headers/product_information.js'
import { ProductPriceHeaders } from '../../lib/headers/product_price.js'
import { ProductImprintDataHeaders } from '../../lib/headers/product_imprint_data.js'
import { ProductImageHeaders } from '../../lib/headers/product_images.js'
import { ProductShippingHeaders } from '../../lib/headers/product_shipping.js'
import { ProductAdditionalChargeHeaders } from '../../lib/headers/product_additional_charge.js'
import { ProductVariationPricingHeaders } from '../../lib/headers/product_variation_pricing.js'

//-------------------------------- import  collections-------------------------------------
import { CollProductInformation, CollProductPrice, CollProductImprintData, CollProductImage, CollProductShipping, CollProductAdditionalCharges, CollProductVariationPrice } from '../api/collections.js';
import { Csvfiles } from '../api/collections.js';
import { Csvfilemapping } from '../api/collections.js';
import { CollUploadJobMaster } from '../api/collections.js';
import { CollUploaderSchema } from '../api/collections.js';

//-------------------------------- import body html -------------------------------------
import './body.html';


let abortChecked = false;
let totRec;
let upldRec;
let errFlag;
let editor;
Template.registerHelper('formatDate', function(date) {
    return moment(date).format('lll');
});


Template.imageUpload.onRendered(function() {
    document.getElementById('btnUploadCsv').focus();
    $('.imageOrFileButton').on('click', function() {
        $('.imageOrFileButton').removeClass('active');
        $(this).addClass('active');
    });
    Meteor.Dropzone.options.dictDefaultMessage = '<p class="first">Drag and drop images here to upload</p>   <p class="second">(only .jpg , .png and .gif files are allowed)</p>';
    Meteor.Dropzone.options.acceptedFiles = '.jpg';
    Meteor.Dropzone.options.autoProcessQueue = true;
    Meteor.Dropzone.options.parallelUploads = 5;
    Meteor.Dropzone.options.processingmultiple = false;
    Meteor.Dropzone.options.uploadMultiple = false;

    var options = _.extend({}, Meteor.Dropzone.options, this.data);
    this.dropzone = new Dropzone('#my-awesome-dropzone.dropzone', options);

    var self = this;

    // this is how you get the response from the ajax call.
    this.dropzone.on('addedfile', function(file) {
        // console.log("fileName:", file);
    });
    this.dropzone.on('complete', function(file) {
        var uploader = new Slingshot.Upload("myFileUploads");

        uploader.send(file, function(error, downloadUrl) {
            if (error) {
                // Log service detailed response.
                console.error('Error uploading');
                // console.log(error);
            } else {
                // console.log("success");
            }
        });
        // console.log(file);
    });

    this.dropzone.on("uploadprogress", function(file, progress) {
        // Update progress bar with the value in the variable "progress", which
        // is the % total upload progress from 0 to 100

        // console.log("progress:", progress);

    });

    this.dropzone.on('queuecomplete', function() {
        // console.log("queuecomplete");


        //location.reload();
        //Router.go("uploaded_file", mergeObjects(Router.currentRouteParams(), {}));
    });

    this.dropzone.on('accept', function(file) {
        alert(4)
    })
    dz = this.dropzone;
});

Template.readCSV.onRendered(function() {
    let $self = this;
    let schema = CollUploaderSchema.find({ owner: Meteor.userId() }).fetch();
    $($self.find("#txtNewSchemaName")).editable({
        validate: function(value) {
            if (value === null || value === '') {
                return 'Empty values not allowed';
            } else if (_.chain(schema).map(function(d) { return d.name.toLowerCase() }).indexOf(value.toLowerCase()).value() >= 0) {
                return 'This name already exist';
            }
        }
    });

    if ($($self.find("#dpdSchema")).val() == '') {
        $($self.find("#txtNewSchemaName")).show();
    } else {
        $($self.find("#txtNewSchemaName")).hide();
    }
});

Template.readCSV.events({
    'change #dpdSchema': function(event, template) {
        var currentEl = event.currentTarget;
        if ($(currentEl).val() == '') {
            $(template.find("#txtNewSchemaName")).show();
            $(template.find('#mapping')).addClass('add-schema-show');
            //$(".newSchemaProperty").show();
            $(template.find("#mapping")).find('.spinner').show();
            $(template.find('#preview')).find('.spinner').show();
            generateAddSchema(template);

            csvFileChange(event, template);
            let schema = CollUploaderSchema.find({ owner: Meteor.userId() }).fetch();

            $(template.find("#txtNewSchemaName")).editable({
                validate: function(value) {
                    if (value === null || value === '') {
                        return 'Empty values not allowed';
                    } else if (_.chain(schema).map(function(d) { return d.name.toLowerCase() }).indexOf(value.toLowerCase()).value() >= 0) {
                        return 'This name already exist';
                    }
                }
            });
        } else {
            $(template.find("#txtNewSchemaName")).hide();
            $(template.find('#mapping')).removeClass('add-schema-show');
            $(template.find("#mapping")).find('.spinner').show();
            $(template.find('#preview')).find('.spinner').show();
            genrateSchema(template);

            csvFileChange(event, template);
        }

    },
    'click #ckbSelectAll': function(event, template) {
        var currentEl = event.currentTarget;
        if ($(currentEl).is(':checked')) {
            $(template.find('tbody')).find('tr').addClass('active').find('.chk').each(function() { $(this).prop('checked', true) });
            $(template.find('#btnDeleteRow')).removeAttr('disabled');
        } else {
            $(template.find('tbody')).find('tr').removeClass('active').find('.chk').each(function() { $(this).prop('checked', false) });
            $(template.find('#btnDeleteRow')).attr('disabled', 'disabled');
        }
    },
    'click table tr td .chk': function(event, template) {
        var currentEl = event.currentTarget;
        if ($(currentEl).is(':checked')) {
            $(currentEl).closest('tr').addClass('active');
        } else {
            $(currentEl).closest('tr').removeClass('active');
        }

        $(template.find('#ckbSelectAll')).prop('checked', true);
        $(template.find('#btnDeleteRow')).attr('disabled', 'disabled');
        $(template.find('table')).find('tr td .chk').each(function() {
            if (!$(this).is(':checked')) {
                $(template.find(' #ckbSelectAll')).prop('checked', false);
                //return false;
            } else {
                $(template.find('#btnDeleteRow')).removeAttr('disabled');
            }
        });
    },
    'click #btnDeleteRow': function(event, template) {
        swal({
                title: "Are you sure?",
                text: "Are you sure you want to delete selected records?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, Delete it!",
                closeOnConfirm: true
            },
            function() {
                let ft = template.filetypes.get(); // all file type
                let activeFiletype = _.find(ft, function(d) { return d.isActive }); // find active filetype
                $(template.find('table')).find('tr td .chk').each(function() {
                    if ($(this).is(':checked')) {
                        activeFiletype.collection.remove($(this).val());
                        $(template.find(' #ckbSelectAll')).prop('checked', false);
                    }
                });
            });

    },
    "click #btngostep2": function(event, template) {
        let Id = CollUploadJobMaster.findOne({ owner: Meteor.userId(), masterJobStatus: 'running', stepStatus: 'upload_pending' })._id;
        CollUploadJobMaster.update(Id, { $set: { stepStatus: 'validation_running' } }, function() {
            Router.go('/validation');
        });
    },
    "click #btnAbortRecord": function(event, template) {
        swal({
                title: "Are you sure?",
                text: "All your existing uploaded data will be deleted and you have to upload the files again",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, Abort it!",
                closeOnConfirm: true
            },
            function() {
                template.abortData.set(false);
                toastr.success("Your data has been successfully deleted.");
            });
    },
    "click .sheets": function(event, template) {
        var currentEl = event.currentTarget;
        if ($(template.find('#csv-file')).files != undefined && $(template.find('#csv-file')).files.length > 0) {
            swal({
                    title: "Are you sure?",
                    text: "Your mapping is loss.",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes",
                    closeOnConfirm: true
                },
                function(isConfirm) {
                    if (isConfirm) {
                        var _href = $(currentEl).attr('href').split('#')[1];
                        let ft = template.filetypes.get(); // all file type
                        let activeFiletypeId = _.indexOf(ft, _.find(ft, function(d) { return d.isActive }));
                        let newFiletypeId = _.indexOf(ft, _.find(ft, function(d) { return d.id == _href }));

                        ft[activeFiletypeId].isActive = false;
                        ft[newFiletypeId].isActive = true;
                        template.filetypes.set(ft);
                        template.abortData.set(true);
                        template.currentSheetName.set(ft[newFiletypeId].name);
                        resetAll(template);
                        setPreviewCollection(newFiletypeId, template);
                        Router.go('/upload/' + _href);
                    }
                });
        } else {
            var _href = $(currentEl).attr('href').split('#')[1];
            let ft = template.filetypes.get(); // all file type
            let activeFiletypeId = _.indexOf(ft, _.find(ft, function(d) { return d.isActive }));
            let newFiletypeId = _.indexOf(ft, _.find(ft, function(d) { return d.id == _href }));

            ft[activeFiletypeId].isActive = false;
            ft[newFiletypeId].isActive = true;
            template.filetypes.set(ft);
            template.abortData.set(true);
            template.currentSheetName.set(ft[newFiletypeId].name);
            resetAll(template);
            setPreviewCollection(newFiletypeId, template);
            Router.go('/upload/' + _href);

            if ($('#dpdSchema :selected').text() == '--Add new--') {
                document.getElementById("txtNewSchemaName").style.display = "inline";
            }
        }
        return
    },
    "click .remove-custom-javascript": function(event, template) {
        var currentEl = event.currentTarget;
        $(currentEl).closest('td').removeClass('has-edit').find('[data-target="#javascripEditorModal"]').attr('data-code', '');
        $(currentEl).closest('td').find('.transform-function').text('').attr('title', '');
        $(template.find('#preview')).find('.spinner').show();
        generateMapping(template);
        generateXEditor(template, function() {
            // generate Preview
            generatePreview(template.find('#csv-file').files[0], template, function() {
                let ft = template.filetypes.get(); // all file type
                let activeFiletypeId = _.find(ft, function(d) { return d.isActive }).id;
                insertCSVMapping(activeFiletypeId, template, function(e, res) {
                    $(template.find('#preview')).find('.spinner').hide();
                });
            });
        });
    },
    "click #btnSaveCustomjavascript": function(event, template) {
        var code = editor.getValue();
        let $selectedDom = $(template.find("a[data-target='#javascripEditorModal'].open"));
        let selectedheader = $selectedDom.attr('data-header');
        $selectedDom.attr('data-code', code).removeClass('open');
        if (code.trim() != '') {
            $selectedDom.attr('title', 'Edit').parent('td').addClass('has-edit').children('.transform-function').text(code).attr('title', code);
        } else {
            $selectedDom.attr('title', 'Edit').parent('td').removeClass('has-edit').children('.transform-function').text(code).attr('title', code);
        }
        $('#javascripEditorModal').modal('hide');

        $(template.find('#preview')).find('.spinner').show();

        generateMapping(template);
        generateXEditor(template, function() {
            // generate Preview
            generatePreview(template.find('#csv-file').files[0], template, function() {
                let ft = template.filetypes.get(); // all file type
                let activeFiletypeId = _.find(ft, function(d) { return d.isActive }).id;
                insertCSVMapping(activeFiletypeId, template, function(e, res) {
                    $(template.find('#preview')).find('.spinner').hide();
                });
            });
        });
    },
    "click a[data-target='#javascripEditorModal']": function(event, template) {
        var currentEl = event.currentTarget;
        $(currentEl).addClass('open');
        setTimeout(function() {
            if (editor == undefined) {
                editor = CodeMirror.fromTextArea(template.find("#customJavascript"), {
                    //placeholder: 'return row[' + $(currentEl).attr('data-header') + ']',
                    lineNumbers: true,
                    mode: "javascript" // set any of supported language modes here
                });
            }
            //editor.setValue();
            let _val = $(currentEl).attr('data-code').toString();
            if (_val != '') {
                editor.setValue(_val);
            } else {
                editor.setValue('return row["' + $(currentEl).attr('data-header') + '"];');
            }
            editor.refresh();
        }, 200);
    },
    "click #csv-file": function(event, template) {
        // if (template.find('#dpdSchema').value != '') {
        //     return true;
        // } else {
        //     toastr.error(" Please select schema.");
        //     return false;
        // }
    },
    "change #csv-file": function(event, template) {
        // if (template.find('#dpdSchema').value == '') {
        //     toastr.error(" Please select schema.");
        //     //$(template.find('#csv-file')).val('');
        //     return false;
        // }

        //$(template.find("#dpdSchema")).append('<option value="">--Add new--</option>');
        $(template.find("#mapping")).find('.spinner').show();
        $(template.find('#preview')).find('.spinner').show();

        if ($(template.find("#dpdSchema")).val() == '') {
            getHeader(template.find('#csv-file').files[0], template, function() {
                generateAddSchema(template);
                csvFileChange(event, template);
            });
        } else {
            genrateSchema(template);
            csvFileChange(event, template);
        }


    },
    "change #hasheader": function(event, template) {
        $(template.find('#mapping')).find('.spinner').show();
        getHeader(template.find('#csv-file').files[0], template, function() {
            generateXEditor(template, function() { // generate x-editor
                $(template.find('#mapping')).find('.spinner').hide();
                $(template.find('#preview')).find('.spinner').show();
                setTimeout(function() {
                    // generate Preview
                    generatePreview(template.find('#csv-file').files[0], template, function() {
                        $(template.find('#preview')).find('.spinner').hide();
                    });
                }, 1000);
            });
        });
    },
    'click #btnNext': function(event, template) {
        if ($(template.find("#dpdSchema")).val() == '' && $(template.find('#txtNewSchemaName')).editable('getValue')['txtNewSchemaName'] == 'Untitled schema') {
            swal({
                title: "Error!",
                text: "Please write new schema name",
                type: "warning",
                html: true
            });
            return false;
        }

        let ft = template.filetypes.get();
        let activeFiletypeId = _.find(ft, function(d) { return d.isActive }).id;
        let mapping = generateMapping(template);
        let diff = _.chain(mapping).filter(function(d) { return d.csvHeader == '' && !d.csvSysHeaderDetail.optional }).map(function(d) { return d.sysHeader }).value();

        if (diff.length > 0) {
            swal({
                title: "Error!",
                text: "Please map <b>'" + diff.join('\', \'') + "'</b>  fields before proceeding as those are mandatory",
                type: "warning",
                html: true
            });
        } else {
            if ($(template.find("#dpdSchema")).val() == '') {
                $(template.find('#btnNext')).addClass('inProgress');
                $(template.find("#txtNewSchemaName")).hide();
                $('.makeBlur').css("display","block");
                insertSchema(template,ft, function() {
                    $(template.find('#mapping')).hide();
                    insertCSVMapping(activeFiletypeId, template,mapping, function(e, res) {
                        parseCSV(template.find('#csv-file').files[0], template,mapping);
                    });
                })
            } else {
                $(template.find('#btnNext')).addClass('inProgress');
                $(template.find("#txtNewSchemaName")).hide();
                $('.makeBlur').css("display","block");
                $(template.find('#mapping')).hide();
                insertCSVMapping(activeFiletypeId, template,mapping, function(e, res) {
                    parseCSV(template.find('#csv-file').files[0], template,mapping);
                });
            }
        }
    },
    'click #btnAbort': function(event, template) {
        swal({
                title: "Abort?",
                text: "Are you sure you want to abort?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes",
                closeOnConfirm: true
            },
            function(isConfirm) {
                if (isConfirm) {
                    abortChecked = true;
                    resetAll(template);
                }
            });
    },
    'click #addNewHeader': function(event, template) {
        var currentEl = event.currentTarget;
        $(currentEl).append('<i class="fa fa-spinner fa-spin"></i>');

        //$(".view-mapping").scrollTop($(".view-mapping")[0].scrollHeight);

        $(template.find('#mapping')).find('.spinner').show();
        let oldHeaders = template.headers.get();
        let oldHeadersLength = oldHeaders.length;
        oldHeaders.push('header' + oldHeadersLength);
      //   let ft = Template.instance().filetypes.get(); // all file type
      //  let activeFiletype = _.find(ft, function(d) { return d.isActive }); // find active filetype
       activeFiletype.header.push({name:'header' + oldHeadersLength,type:String});
        template.headers.set(oldHeaders);

        //generateMapping(template);
        let _hasHeader = $(template.find('#hasheader')).prop('checked');

        let sysHeaders = template.headers.get();


        let existMapping; //Csvfilemapping.findOne({ owner: Meteor.userId(), fileTypeID: activeFiletype.id });

        if (_hasHeader) {
            existMapping = template.mappingWithHeader.get();
            existMapping.push({
                sysHeader: 'header' + oldHeadersLength,
                csvHeader: '',
                transform: '',
                csvSysHeaderDetail: undefined
            });
            template.mappingWithHeader.set(existMapping);
        } else {
            existMapping = template.mappingWithOutHeader.get();
            existMapping.push({
                sysHeader: 'header' + oldHeadersLength,
                csvHeader: '',
                transform: '',
                csvSysHeaderDetail: undefined
            });
            template.mappingWithOutHeader.set(existMapping);
        }

        template.headers.set(sysHeaders);
        setTimeout(function() {
            generateXEditor(template, function() {
                $(template.find('#mapping')).find('.spinner').hide();
                $(currentEl).children('i').remove();
                $(".view-mapping").scrollTop($(".view-mapping")[0].scrollHeight);
                $(template.find('#preview')).find('.spinner').show();
                setTimeout(function() {
                    // generate Preview
                    generatePreview(template.find('#csv-file').files[0], template, function() {
                        $(template.find('#preview')).find('.spinner').hide();
                    });
                }, 2000);
            });
        }, 1000);
    },
    'click #btnUploadImage': function(event, template) {
        $(template.find('#uploadCsv')).hide();
        $(template.find('#uploadImage')).show();
    },
    'click #btnUploadCsv': function(event, template) {
        $(template.find('#uploadCsv')).show();
        $(template.find('#uploadImage')).hide();
    }
});

// get schemaType

let getschemaType = function(schemaType) {
    let regEx = undefined;
    switch (schemaType.toLowerCase()) {
        case 'email':
            regEx = 'SimpleSchema.RegEx.Email';
            break;

        case 'url':
            regEx = 'SimpleSchema.RegEx.Url';
            break;

        case 'time':
            regEx = '^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$';
            break;

        case 'phone':
            regEx = 'SimpleSchema.RegEx.Phone';
            break;
        case 'pin-code':
            regEx = 'SimpleSchema.RegEx.ZipCode';
            break;
    }
    return regEx;
}



let insertSchema = function(template,ft, cb) {
  console.log("Template is.....",template)
  console.log("Header is.....",header)
    let activeFiletype = _.indexOf(ft, _.find(ft, function(d) { return d.isActive }));
    let header = template.headers.get();
    let NewHeaderSchema = "";
    _.each(header, function(d, index) {
        let propertyData = $("#property_" + index).data();
        let _type = $(template.find("#dpdSchemaType_" + index)).editable('getValue')["dpdSchemaType_" + index];
        console.log("Property data is....",propertyData)
        console.log("Type is....",_type)
        if (propertyData != undefined) {
            let property = {
                type: _type,
                min: (propertyData.min == '') ? undefined : propertyData.min,
                max: (propertyData.max == '') ? undefined : propertyData.max,
                regEx: (propertyData.regEx == '') ? undefined : propertyData.regEx,
                optional: (propertyData.optional == undefined) ? true : propertyData.optional,
                defaultValue: (propertyData.defaultValue == '') ? undefined : propertyData.defaultValue,
                label: (propertyData.label == undefined || propertyData.label == '' || propertyData.label == null) ? d : propertyData.label,
                allowedValues: (propertyData.allowedValues == '') ? undefined : propertyData.allowedValues
            };
            if ((getschemaType(_type)) != undefined) {
                property.type = 'String';
                property.regEx = getschemaType(_type);
            }
            NewHeaderSchema += "\"" + d + "\":{type:" + property.type + ",defaultValue:" + property.defaultValue + ",allowedValues:" + property.allowedValues + ",regEx:" + property.regEx + ",min:" + property.min + ",max:" + property.max + ",optional: " + property.optional + ",label:\"" + property.label + "\"},";
        } else {
            NewHeaderSchema += "\"" + d + "\":{type:" + _type + ",optional: true,setLabel: \"" + d + "\"},";
        }
    });
    console.log("NewHeaderSchema is ....",NewHeaderSchema)
    NewHeaderSchema = NewHeaderSchema.slice(0, -1);
    let data = {
        "name": $(template.find('#txtNewSchemaName')).editable('getValue')['txtNewSchemaName'],
        "schema": NewHeaderSchema,
        "createdAt": new Date(),
        "updateAt": "",
        "owner": Meteor.userId(),
        "username": Meteor.user().username
    };
    CollUploaderSchema.insert(data, function(e, res) {
        // console.log('res', res);
        $(template.find("#dpdSchema")).children('option[value=' + res + ']').prop('selected', true);
        NewHeaderSchema = "{" + NewHeaderSchema + ",fileID: {type: String,label: 'file ID'},owner: {type: String,label: 'owner'},username: {type: String,label: 'username'}}";
        let newSchema = eval("new SimpleSchema(" + NewHeaderSchema + ")");
        ft[activeFiletype].schema = newSchema;
        ft[activeFiletype].collection.attachSchema(newSchema, { mutate: true,replace: true });
        cb();
    });
}

let generateAddSchema = function(template) {
    // get current sheet
    let ft = template.filetypes.get(); // all file type
    let activeFiletype = _.indexOf(ft, _.find(ft, function(d) { return d.isActive }));

    // add schema
    let schemaJSON = template.csvHeaders.get();

    let NewHeaderSchema = "";
    _.each(schemaJSON, function(d) {
        NewHeaderSchema += "\"" + d + "\":{type: String,optional: true,label: \"" + d + "\"},";
    })

    // create new schema
    schemaJSON.schema = "{" + NewHeaderSchema + "fileID: {type: String,label: 'file ID'},owner: {type: String,label: 'owner'},username: {type: String,label: 'username'}}";
    let newSchema = eval("new SimpleSchema(" + schemaJSON.schema + ")");
    ft[activeFiletype].schema = newSchema;

    // generate header using with new schema
    let header = _.chain(ft[activeFiletype].schema._schema).reject(function(d, k) { return k == 'fileID' || k == 'owner' || k == 'username' }).map(function(d) { return d.label.toLowerCase() }).value();

    ft[activeFiletype].collection.attachSchema(newSchema, {mutate: true, replace: true });

    // set new headers
    template.headers.set(header);
}

let csvFileChange = function(event, template) {
    // Display an error toast, with a title

    let _files = [];
    abortChecked = false;

    for (let i = 0; i < template.find('#csv-file').files.length; i++) {
        let regex = new RegExp("(.*?)\.(csv)$");
        if ((regex.test(template.find('#csv-file').files[i].name))) {
            // view file progress
            let existFiles = template.files.get();
            existFiles.splice(0, 0, { name: template.find('#csv-file').files[i].name, progress: 0, mapping: true });
            template.files.set(existFiles);

            _files.push(template.find('#csv-file').files[i]);
        }
    }
    Papa.LocalChunkSize = 100000; // 1000kb
    for (let i = 0; i < _files.length; i++) {

        template.mappingWithHeader.set([]);
        template.mappingWithOutHeader.set([]);
        $(template.find("#upload-csv-zone")).addClass('onprogress');

        //template.find("#mapping").style.display = 'block';

        getHeader(_files[i], template, function() {
            generateXEditor(template, function() { // generate x-editor
                $(template.find("#mapping")).find('.spinner').hide();
                $(template.find("#upload-csv-zone")).hide();
                $(template.find("#mapping")).show();
                $(template.find("#upload-csv-zone")).removeClass('onprogress');

                // generate Preview
                generatePreview(template.find('#csv-file').files[0], template, function() {
                    //template.find("#mapping").style.display = 'none';
                    $(template.find('#preview')).find('.spinner').hide();
                    $(template.find("#preview")).show();

                });
            });
        });
    }
}

let genrateSchema = function(template) {
    // get current sheet
    let ft = template.filetypes.get(); // all file type
    let activeFiletype = _.indexOf(ft, _.find(ft, function(d) { return d.isActive }));

    // add schema
    let schemaJSON = CollUploaderSchema.findOne({ owner: Meteor.userId(), _id: template.find('#dpdSchema').value }); // get schema json
    // create new schema
    schemaJSON.schema = "{" + schemaJSON.schema + ",fileID: {type: String,label: 'file ID'},owner: {type: String,label: 'owner'},username: {type: String,label: 'username'}}";
    // let newSchema = eval("new SimpleSchema(" + schemaJSON.schema + ")");
    let newSchema = eval("new SimpleSchema(" + schemaJSON.schema + ",{clean: {filter: true,autoConvert: true,removeEmptyStrings: true,trimStrings: true,getAutoValues: true,removeNullsFromArrays: true,},})");
    ft[activeFiletype].schema = newSchema;

    // generate header using with new schema
    let header = _.chain(ft[activeFiletype].schema._schema).reject(function(d, k) { return k == 'fileID' || k == 'owner' || k == 'username' }).map(function(d) { return d.label.toLowerCase() }).value();

    ft[activeFiletype].collection.attachSchema(newSchema, {mutate: true, replace: true });

    // set new headers
    template.headers.set(header);
}

let genrateNewSchema = function(template) {

    let ft = template.filetypes.get(); // all file type
    let activeFiletype = _.indexOf(ft, _.find(ft, function(d) { return d.isActive }));
    let header = template.headers.get();

    let schemaLabel = _.map(getActiveHeaders(template), function(d) { return (d.label == undefined) ? '' : d.label.toLowerCase() });

    let newHeaders = _.chain(header).difference(schemaLabel).value();
    // create new schema

    let NewHeaderSchema = "";
    _.each(newHeaders, function(d) {
        NewHeaderSchema += "\"" + d + "\":{type: String,optional: true,label: \"" + d + "\"},";
    })

    let schemaJSON = CollUploaderSchema.findOne({ owner: Meteor.userId(), _id: template.find('#dpdSchema').value });

    schemaJSON.schema = "{" + schemaJSON.schema + "," + NewHeaderSchema + "fileID: {type: String,label: 'file ID'},owner: {type: String,label: 'owner'},username: {type: String,label: 'username'}}";

    let newSchema = eval("new SimpleSchema(" + schemaJSON.schema + ", {clean: {filter: true,autoConvert: true,removeEmptyStrings: true,trimStrings: true,getAutoValues: true,removeNullsFromArrays: true,},})");

    ft[activeFiletype].schema = newSchema;

    ft[activeFiletype].collection.attachSchema(newSchema, {mutate: true, replace: true });

}

let setPreviewCollection = function(newFiletypeId, template) {
    let ft = template.filetypes.get(); // all file type
    let activeFiletype = ft[newFiletypeId]; // find active filetype
    let obj = CollUploadJobMaster.findOne({ owner: Meteor.userId(), masterJobStatus: 'running' });
    let data = [];
    if (obj != undefined && activeFiletype != undefined) {
        if (obj.hasOwnProperty(activeFiletype.id)) {
            data = activeFiletype.collection.find({ fileID: obj[activeFiletype.id].id }).fetch();
        }
    }
    template.previewCollection.set(data);
}

let generateMapping = function(template) {
    // get new mapping
    let mapping = [];
    let sysHeaders = template.headers.get();

    let activefile = getActiveHeaders(template); // get active file type data
    //    // console.log('activefile', activefile);
    // create mapping
    sysHeaders.forEach(function(result, index) {
        mapping.push({
            sysHeader: $(template.find('#dpdsysheader_' + index)).editable('getValue')['dpdsysheader_' + index], //$(template.find('#dpdsysheader_' + index)).text(),
            csvHeader: $(template.find('#dpdcsvheader_' + index)).editable('getValue')['dpdcsvheader_' + index], //$(template.find('#dpdcsvheader_' + index)).editable('getValue')['dpdcsvheader_' + index]
            transform: $(template.find('#txtCustomJavascript_' + index)).attr('data-code'),
            csvSysHeaderDetail: _.find(activefile, function(d) { return d.label.toLowerCase() == result })
        })
    });
    template.mapping.set(mapping);
    let _hasHeader = $(template.find('#hasheader')).prop('checked');
    if (_hasHeader) {
        template.mappingWithHeader.set(mapping);
    } else {
        template.mappingWithOutHeader.set(mapping);
    }
    return mapping;
}

const schemaTypes = ['String', 'Number', 'Boolean', 'Date', 'Email', 'URL', 'Time', 'Phone', 'Pin-code'];

let generateXEditor = function(template, cb) {
    let activefile = template.headers.get(); //_.map(getActiveHeaders(template), function(d) { return (d.label == undefined) ? '' : d.label }); // get active file type data
    let schemaLabel = _.map(getActiveHeaders(template), function(d) { return (d.label == undefined) ? '' : d.label.toLowerCase() });
    //// console.log('schemaLabel', schemaLabel);

    let _csvHeader = template.csvHeaders.get();
    let _hasHeader = $(template.find('#hasheader')).prop('checked');
    // create mapping
    let ft = template.filetypes.get(); // all file type
    let activeFiletype = _.find(ft, function(d) { return d.isActive });
    console.log(activeFiletype);// find active filetype
    let existMapping; //Csvfilemapping.findOne({ owner: Meteor.userId(), fileTypeID: activeFiletype.id });

    if (_hasHeader) {
        existMapping = template.mappingWithHeader.get();
    } else {
        existMapping = template.mappingWithOutHeader.get();
    }

    // if (existMapping != undefined) {
    //     activefile = _.union(activefile, _.chain(existMapping).map(function(d) { return d.sysHeader }).value());
    // }
    activefile.forEach(function(result, index) {
        let _val = '';
        if (existMapping.length > 0) {
            let sysHeaderObj = _.chain(existMapping).find(function(d) { return d.sysHeader == result.toLowerCase(); }).value();
            _val = sysHeaderObj.csvHeader;
        }

        if (_val == '' || _val == 'Custom function') {
            _val = getHeaderDistance(result, _csvHeader);
        }

        //// console.log('result', result.toLowerCase());
        $(template.find('#dpdsysheader_' + index)).editable("destroy");
        if (_.indexOf(schemaLabel, result) == -1 || $(template.find("#dpdSchema")).val() == '') {
            $(template.find('#dpdsysheader_' + index)).editable({
                validate: function(value) {
                    if (value === null || value === '') {
                        return 'Empty values not allowed';
                    } else if (_.chain(activefile).without(result).indexOf(value).value() >= 0) {
                        return 'This header already exist';
                    }
                },
                success: function(response, newValue) {
                  // console.log(newValue,"------------",index);
                  //
                  // activeFiletype.header[index-1].name=newValue;
                    activefile[_.indexOf(activefile, result)] = newValue;

                    console.log(_.indexOf(activefile, result));
                    console.log(activefile[_.indexOf(activefile, result)]);
                    changeXEditorValue(template);
                }
            });
        } else {
            $(template.find('#dpdsysheader_' + index)).editable({
                disabled: true
            });
        }

        if ($(template.find("#dpdSchema")).val() == '') {
            $(template.find('#dpdSchemaType_' + index)).editable({
                type: 'select',emptytext: '--NA--',
                value: 'String',
                source: schemaTypes,
                success: function(response, newValue) {
                    // console.log(newValue);
                    var content_type = '#property_content_' + newValue;
                    $("#property_" + index).data('bs.popover').options.content = $(content_type).html();
                }
            });

            var content_type = '#property_content_' + $(template.find('#dpdSchemaType_' + index)).text();

            $(template.find("#property_" + index)).popover({
                //trigger: "click",
                //trigger: 'manual',
                html: true,
                content: $(content_type).html(),
            }).on('click', function() {

                //$(this).popover('show');

                $('[data-toggle=popover]').not(this).popover('hide');

                // put old value
                let propertyData = $("#property_" + index).data();
                if (propertyData != undefined) {
                    $("#txtMin").val(propertyData.min);
                    $("#txtMax").val(propertyData.max);
                    $("#txtRegEx").val(propertyData.regEx);
                    // $("#sDate").val(propertyData.sDate);
                    // $("#eDate").val(propertyData.eDate);
                    // $("#sTime").val(propertyData.sTime);
                    // $("#eTime").val(propertyData.eTime);
                    $("#default").val(propertyData.defaultValue);
                    $("#setLabel").val(propertyData.label);
                    $("#allowedValue").val(propertyData.allowedValues);
                    $("#ckbSchemaOptional").prop('checked', propertyData.optional);
                }


                //$('[data-toggle=popover]').popover('show');
                //$(template.find("button[data-popoverdismiss='true']")).unbind('click');
                $("button[data-popoverdismiss='true']").unbind('click');
                $("button[data-popoverdismiss='true']").click(function() {
                    $('[data-toggle=popover]').popover('hide');
                });
                $("#saveProperty").unbind('click');
                $("#saveProperty").click(function() {
                    $("#property_" + index).data({
                        min: $("#txtMin").val(),
                        max: $("#txtMax").val(),
                        // sDate: $("#sDate").val(),
                        // eDate: $("#eDate").val(),
                        // sTime: $("#sTime").val(),
                        // eTime: $("#eTime").val(),
                        defaultValue: $("#default").val(),
                        label: $("#setLabel").val(),
                        allowedValues: $("#allowedValue").val(),
                        regEx: $("#txtRegEx").val(),
                        optional: $("#ckbSchemaOptional").prop('checked')
                    });
                    $('[data-toggle=popover]').popover('hide');
                });

                // let type = $(template.find('#dpdSchemaType_' + index)).editable('getValue')['dpdSchemaType_' + index].toLowerCase();
                // if (type == 'number') {

                // }
            });
        }

        $(template.find('#dpdcsvheader_' + index)).editable("destroy");
        $(template.find('#dpdcsvheader_' + index)).editable({
            //value: _val.toLowerCase(),
            type: 'select',
            emptytext: '--NA--',
            source: _csvHeader,
            success: function(response, newValue) {
                changeXEditorValue(template);
            }
        });
        if (_val != '') {
            $(template.find('#dpdcsvheader_' + index)).editable('setValue', _val);
        } else {
            $(template.find('#dpdcsvheader_' + index)).editable('setValue', '');
        }

        $(template.find('#txtCustomJavascript_' + index)).attr('data-header', _val != '' ? _val : index).attr('data-code', '').attr('title', 'Add custom code').parent('td').removeClass('has-edit').children('.transform-function').text('').attr('title', '');
        if (existMapping.length > 0) {
            let sysHeaderObj = _.chain(existMapping).find(function(d) { return d.sysHeader == result.toLowerCase(); }).value();
            if (sysHeaderObj.transform != '') {
                let code = sysHeaderObj.transform;
                $(template.find('#txtCustomJavascript_' + index)).attr('data-code', code).attr('title', 'Edit').parent('td').addClass('has-edit').children('.transform-function').text(code).attr('title', code);

                $(template.find('#dpdcsvheader_' + index)).editable("destroy");
                $(template.find('#dpdcsvheader_' + index)).editable({
                    type: 'text',
                    value: 'Custom function',
                    disabled: true
                });

                $(template.find('#dpdcsvheader_' + index)).editable('setValue', 'Custom function');
            }
        }
    });

    // _csvHeader.forEach(function(result, index) {
    //     let _val = '';

    //     if (existMapping.length > 0) {
    //         let sysHeaderObj = _.chain(existMapping).find(function(d) { return d.csvHeader == result }).value();
    //         //// console.log('sysHeaderObj', sysHeaderObj);
    //         if (sysHeaderObj.csvSysHeaderDetail != undefined) {
    //             _val = result == sysHeaderObj.csvSysHeaderDetail.column ? sysHeaderObj.csvSysHeaderDetail.text : '';
    //         }
    //     }
    //     if (_val == '') {
    //         _val = getHeaderDistance(result, activefile);
    //     }

    //     $(template.find('#dpdsysheader_' + index)).editable("destroy");
    //     $(template.find('#dpdsysheader_' + index)).editable({
    //         //value: _val.toLowerCase(),
    //         emptytext: '--NA--',
    //         source: activefile,
    //         success: function(response, newValue) {
    //             changeXEditorValue(template);
    //         }
    //     });

    //     $(template.find('#dpdsysheader_' + index)).editable('setValue', _val);
    //     if (_val != '') {
    //         activefile = _.without(activefile, _val);
    //     }
    //     // if (_val != undefined) {
    //     //     //$(template.find('#dpdsysheader_' + index)).editable('setValue', _val.toLowerCase());
    //     // }
    //     //activefile = _.without(activefile, _val);

    //     if (existMapping.length > 0) {
    //         let sysHeaderObj = _.chain(existMapping).find(function(d) { return d.csvHeader == result }).value();
    //         //// console.log('sysHeaderObj', sysHeaderObj);
    //         if (sysHeaderObj.transform != undefined) {
    //             let code = sysHeaderObj.transform;
    //             $(template.find('#txtCustomJavascript_' + index)).attr('data-code', code).attr('title', 'Edit').parent('td').addClass('has-edit').children('.transform-function').text(code).attr('title', code);
    //         }
    //     }
    // });
    cb();

}

let changeXEditorValue = function(template) {
    //// console.log('success');
    $(template.find('#preview')).find('.spinner').show();
    setTimeout(function() {
        generatePreview(template.find('#csv-file').files[0], template, function() {
            $(template.find('#preview')).find('.spinner').hide();
        });
    }, (500));
}

let resetAll = function(template) {
    $(template.find('#csv-file')).val('');
    //$(template.find("#dpdSchema option[value='']")).remove();
    $(template.find("#txtNewSchemaName")).html("Untitled schema");
    $(template.find("#mapping")).hide();
    $(template.find("#preview")).hide();
    $(template.find('#btnNext')).find('.progress-inner').css({ 'width': '0%' });
    $(template.find('#btnNext')).removeClass('inProgress');
    $('.makeBlur').css('display','none');
    $(template.find("#upload-csv-zone")).show();
    $(template.find('#btnNext')).find('.content').text('Proceed');
    $(template.find('#btnNext')).show();
    //$(template.find('#btnAbort')).hide();
    $(template.find("#handson-Zone-during-upload")).hide();
    $(template.find('#uploadCsv')).show();
    $(template.find('#uploadImage')).hide();
    template.mappingWithHeader.set([]);
    template.mappingWithOutHeader.set([]);
    toastr.clear();
    template.headers.set([]);
}

let getHeaderDistance = function(sysColumn, csvHeaders) {
    let res = csvHeaders[0];
    let col = sysColumn.toLowerCase();
    csvHeaders.forEach(function(d) {
        res = Levenshtein.get(col.replace(/[^a-z0-9]/gi, ''), d.toLowerCase().replace(/[^a-z0-9]/gi, '')) < Levenshtein.get(col.replace(/[^a-z0-9]/gi, ''), res.toLowerCase().replace(/[^a-z0-9]/gi, '')) ? d : res;
    });
    res = Levenshtein.get(res.toLowerCase().replace(/[^a-z0-9]/gi, ''), col.replace(/[^a-z0-9]/gi, '')) < 4 ? res : '';
    return res;
}

let insertCSVMapping = function(fileTypeID, template,mapping, cb) {
    let _hasHeader = $(template.find('#hasheader')).prop('checked');
    let isExist = Csvfilemapping.findOne({ owner: Meteor.userId(), fileTypeID: fileTypeID, hasHeader: _hasHeader });

    if (isExist == undefined) {
        let _data = {
            mapping: mapping,
            fileTypeID: fileTypeID,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            hasHeader: _hasHeader,
            owner: Meteor.userId(),
            username: Meteor.user().username
        };
        Csvfilemapping.insert(_data, function(e, res) {
            cb(e, res);
        });
    } else {
        let _data = {
            mapping: mapping,
            updateAt: new Date()
        };
        Csvfilemapping.update(isExist._id, { $set: _data }, function(e, res) {
            cb(e, res);
        });
    }
}

// Return array of string values, or NULL if CSV string not well formed.
let CSVtoArray = function(text) {
    let p = '',
        row = [''],
        ret = [row],
        i = 0,
        r = 0,
        s = !0,
        l;
    for (l in text) {
        l = text[l];
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) l = row[++i] = '';
        else if ('\n' === l && s) {
            if ('\r' === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = [l = ''];
            i = 0;
        } else row[i] += l;
        p = l;
    }
    return ret.slice(0, ret.length - 1);
};

let arrayToCSV = function(row) {
    for (let i in row) {
        for (let j in row[i]) {
            let item = row[i][j];
            if (item.indexOf && (item.indexOf(',') !== -1 || item.indexOf('"') !== -1)) {
                item = '"' + item.replace(/"/g, '""') + '"';
            } else {
                item = "\"" + item + "\"";
            }
            row[i][j] = item;
        }
        row[i] = row[i].join(',');
    }
    //// console.log('row', row);
    return row.join('\n');
}

let getHeader = function(_file, template, cb) {
    let _hasHeader = $(template.find('#hasheader')).prop('checked');
    Papa.parse(_file, {
        header: _hasHeader,
        dynamicTyping: true,
        encoding: "UTF-8",
        skipEmptyLines: true,
        beforeFirstChunk: function(chunk) {
            let rows = CSVtoArray(chunk);
            let headings = rows[0];
            if (!_hasHeader) {
                let newHeaders = [];
                headings.forEach(function(result, index) {
                    newHeaders.push('header' + (index + 1));
                });
                template.csvHeaders.set(newHeaders);
            } else {
                template.csvHeaders.set(headings);
            }
        },
        error: function(error, f) {
            // console.log("ERROR:", error, f);
        },
        chunk: function(results, streamer) {
            streamer.abort();
            cb();
        }
    });
};

let getTransformVal = function(headings, row, transformStr, oldValue, index) {
    try {
        let code = transformStr;
        _.each(headings, function(d, index) {
            row[d] = row[index];
        });
        row['_id'] = index;
        let result = new Function("row", code).call(this, row);
        return result;
    } catch (e) {
        return oldValue;
    }
}

let generateDatawithNewHeader = function(rows, _hasHeader, mapping, isPreview, template) {
    let headings = template.csvHeaders.get();
    //var oldRows = jQuery.extend(true, {}, rows);
    let activeHeaders = getActiveHeaders(template).slice(1, -1);
    let newHeading = _.map(mapping, function(v) { return v.sysHeader });
    let newData = [];
    _.each(rows, function(row, index) {
        let newRow = [];
        _.each(mapping, function(d, inx) {
            let item = '';
            if (d.csvHeader != "") {
                if (d.transform.trim() != '') {
                    item = getTransformVal(headings, rows[index], d.transform.trim(), rows[index][inx], index);
                } else {
                    item = row[_.indexOf(headings, d.csvHeader)];
                }
            }
            newRow.push(item == undefined ? '' : item);
        });
        newData.push(newRow);
    });

    _.each(mapping, function(d, inx) {
        if (_hasHeader) {
            newData[0][inx] = (isPreview || d.csvSysHeaderDetail == undefined) ? d.sysHeader : d.csvSysHeaderDetail.text;
        } else {
            newHeading[inx] = (isPreview || d.csvSysHeaderDetail == undefined) ? d.sysHeader : d.csvSysHeaderDetail.text;
        }
    });
    return (!_hasHeader ? (newHeading.join(',') + '\n') : "") + arrayToCSV(newData);
}

let generatePreview = function(_file, template, cb) {
    let _hasHeader = $(template.find('#hasheader')).prop('checked');
    generateMapping(template);
    mapping = template.mapping.get();

    //Papa.LocalChunkSize = _file.size;
    Papa.parse(_file, {
        header: true,
        dynamicTyping: true,
        encoding: "UTF-8",
        skipEmptyLines: true,
        newline: "\n",
        beforeFirstChunk: function(chunk) {
            let rows = CSVtoArray(chunk);
            let newrows = generateDatawithNewHeader(rows, _hasHeader, mapping, true, template);
            return newrows;
        },
        error: function(error, f) {
            // console.log("ERROR:", error, f);
        },
        chunk: function(results, streamer) {
            template.previewRec.set(results.data.slice(0, 5));
            streamer.abort();
            cb();
            return;
        }
    });
};

let setNextFile = function(template) {
    let ft = template.filetypes.get(); // all file type
    let activeFiletypeId = _.indexOf(ft, _.find(ft, function(d) { return d.isActive }));
    swal({
            title: "Upload successfully",
            text: "Are you ready to upload next file?",
            type: "success",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes",
            closeOnConfirm: true
        },
        function(isConfirm) {
            if (isConfirm) {
                if (ft[activeFiletypeId].id == "ProductVariationPrice") {
                    ft[activeFiletypeId].isActive = true;
                    ft[activeFiletypeId].isDone = true;
                    template.filetypes.set(ft);
                    template.abortData.set(true);
                } else {
                    ft[activeFiletypeId].isActive = false;
                    ft[activeFiletypeId].isDone = true;
                    ft[activeFiletypeId + 1].isActive = true;
                    template.filetypes.set(ft);
                    template.abortData.set(true);
                    resetAll(template);
                    Router.go('/upload/' + ft[activeFiletypeId + 1].id);
                }
            } else {
                ft[activeFiletypeId].isActive = true;
                ft[activeFiletypeId].isDone = true;
                template.filetypes.set(ft);
                template.abortData.set(true);
            }
        });
}

let parserObj;

let parseCSV = function(_file, template,mapping) {
    let _hasHeader = $(template.find('#hasheader')).prop('checked');
    $(template.find('#btnNext')).find('.progress-inner').css({ 'width': '0%' });
    $(template.find('#btnNext')).find('.content').text('Start uploding...');
    let file = {
        name: _file.name,
        size: _file.size,
        progress: 0,
        totalNoOfRecords: 0,
        uploadedRecords: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: '',
        owner: Meteor.userId(),
        username: Meteor.user().username
    };
    Papa.LocalChunkSize = _file.size;
    Csvfiles.insert(file, function(e, res) {
        $('#buttonProceedNext').hide();
        let fileID = res;
        let ft = template.filetypes.get();
        let activeFiletype = _.find(ft, function(d) { return d.isActive });
        let chunks = 1;
        let totalRecords = 0;
        let uploadedRecords = 0;
        let progress = 0;
        let read_write = 0;
        let uploaderBatchSize = 50;

        Papa.parse(_file, {
            header: true,
            dynamicTyping: true,
            encoding: "UTF-8",
            skipEmptyLines: true,
            newline: "\n",
            complete: function(results) {
              console.log("Results",results)
                if (!abortChecked && progress == 100) {
                    updateJobMaster(activeFiletype.id, fileID, function() {
                        $('.makeBlur').css("display","none");
                    });
                }
            },
            error:  function(error, f) {
                // console.log("ERROR:", error, f);
            },
            step:  function(results, parser) {
                if (abortChecked) {
                    parser.abort();
                    return;
                }
                let t0,t1
                parserObj = parser;
                t0 = performance.now()

                //console.log("====before push parser.pause===", t0)
                read_write++;
                if(read_write >= uploaderBatchSize && !parser.paused()) {
                // if(!parser.paused()){
                   parser.pause();
                   console.log("Parser paused........");
                }

                 insertCSVData(results.data[0], fileID, activeFiletype.collection, activeFiletype, function() {
                   console.log("------------------",results.data[0],"-------------");
                    toastr.clear();
                    ++uploadedRecords
                    read_write--;

                    let newProgress = Math.round((uploadedRecords * 100) / totalRecords);

                    if(read_write <= 0 && parser.paused()) {
                    // if(parser.paused()){
                      parser.resume();
                    }
                    if (progress == newProgress) {

                      $(template.find('#btnNext')).find('.progress-inner').css({ 'width': newProgress + '%' })
                      $(template.find('#btnNext')).find('.content').text(newProgress + '% completed');
                      $(template.find('#buttonProceedNext')).find('.progress-inner').css({ 'width': newProgress + '%' })
                      $(template.find('#buttonProceedNext')).find('.content').text(newProgress + '% completed');
                      // console.log()
                      // if(parser.paused()) {
                      //   parser.resume();
                      //   console.log("Parser resumed");
                      // }

                        let v1 = performance.now()
                  //      console.log("====parser.resume ==1=", v1-t0)
                    } else {
                      console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
                        $(template.find('#btnNext')).find('.progress-inner').css({ 'width': newProgress+ '%' })
                        $(template.find('#btnNext')).find('.content').text(newProgress + '% completed');
                        $(template.find('#buttonProceedNext')).find('.progress-inner').css({ 'width': newProgress + '%' })
                        $(template.find('#buttonProceedNext')).find('.content').text(newProgress + '% completed');
                        Csvfiles.update(fileID, { $set: { progress: newProgress, uploadedRecords: uploadedRecords } }, function(e, res) {
                          // if(parser.paused()) {
                          //   parser.resume();
                          //   console.log("Parser resumed");
                          // }
                          let v1 = performance.now()
                            //console.log("====parser.resume ==2=", v1-t0)
                        });
                    }
                    progress = newProgress;
                    console.log(uploadedRecords)
                    console.log(totalRecords);

                    // if(parserObj.paused()){
                    //   parserObj.resume();
                    // }

                    if(errFlag == true && parser.paused()) {
                      parserObj.resume();
                      console.log("Parser resumed");
                    }
                    if(uploadedRecords == totalRecords && read_write <= 0){
                      parser.abort();
                          setNextFile(template);
                    }
                });
            },
            beforeFirstChunk: function(chunk) {
              //alert("beforeFirstChunk")
                let rows = CSVtoArray(chunk);
                totalRecords = (_hasHeader) ? rows.length - 1 : rows.length - 0; // last row getting empty
                Csvfiles.update(fileID, { $set: { totalNoOfRecords: totalRecords } }, function(e, res) {});
                  return generateDatawithNewHeader(rows, _hasHeader, mapping, false, template);
            },
        });
    });
}

let getActiveHeaders = function(template) {
    let ft = template.filetypes.get(); // all file type
    let activeFiletype = _.find(ft, function(d) { return d.isActive }); // find active filetype
    let header = _.chain(activeFiletype.schema._schema).map(function(d, k) { d['text'] = k; return d; }).reject(function(d) { return d.text == 'fileID' || d.text == 'owner' || d.text == 'username' }).value();
    return _.uniq(header);
}

Template.readCSV.onCreated(function() {
    //// console.log(Router.current().params.id);
    //// console.log(this);
    // if (this.data == undefined) {
    //     Router.go('/');
    // }
    //// console.log(Meteor.userId());
    //let masterJob = this.data;
    //// console.log('schema', _.chain(ProductInformationSchema._schema).filter(function(d) { return d.optional }).map(function(d) { return d.label }).value());
    let masterJob = CollUploadJobMaster.findOne({ owner: Meteor.userId(), masterJobStatus: 'running' });
    let a =
        toastr.options = {
            "closeButton": true,
            // "showMethod": "show",
            // "hideDuration": "1000",
            // "showDuration": "0",
            // "timeOut": "10000000"
        }
    this.files = new ReactiveVar([]);
    this.csvHeaders = new ReactiveVar([]);
    this.headers = new ReactiveVar([]);
    this.previewRec = new ReactiveVar([]);
    this.filetypes = new ReactiveVar(
        [
            { id: 'ProductInformation', name: 'Product Information', isDone: masterJob.hasOwnProperty('ProductInformation') ? true : false, isActive: false, header: ProductInformationHeaders, collection: CollProductInformation, require: true, schema: "" },
            { id: 'ProductPrice', name: 'Product Pricing', isDone: masterJob.hasOwnProperty('ProductPrice') ? true : false, isActive: false, header: ProductPriceHeaders, collection: CollProductPrice, require: false, schema: "" },
            { id: 'ProductImprintData', name: 'Imprint Data', isDone: masterJob.hasOwnProperty('ProductImprintData') ? true : false, isActive: false, header: ProductImprintDataHeaders, collection: CollProductImprintData, require: false, schema: "" },
            { id: 'ProductImage', name: 'Images', isDone: masterJob.hasOwnProperty('ProductImage') ? true : false, isActive: false, header: ProductImageHeaders, collection: CollProductImage, require: false, schema: "" },
            { id: 'ProductShipping', name: 'Shipping', isDone: masterJob.hasOwnProperty('ProductShipping') ? true : false, isActive: false, header: ProductShippingHeaders, collection: CollProductShipping, require: false, schema: "" },
            { id: 'ProductAdditionalCharges', name: 'Additional Charges', isDone: masterJob.hasOwnProperty('ProductAdditionalCharges') ? true : false, isActive: false, header: ProductAdditionalChargeHeaders, collection: CollProductAdditionalCharges, require: false, schema: "" },
            { id: 'ProductVariationPrice', name: 'Variation Price', isDone: masterJob.hasOwnProperty('ProductVariationPrice') ? true : false, isActive: false, header: ProductVariationPricingHeaders, collection: CollProductVariationPrice, require: false, schema: "" }
        ]
    );
    this.mapping = new ReactiveVar([]);
    this.mappingWithOutHeader = new ReactiveVar([]);
    this.mappingWithHeader = new ReactiveVar([]);
    this.abortData = new ReactiveVar(true);
    this.previewCollection = new ReactiveVar([]);
    this.currentSheetName = new ReactiveVar();

    let ft = Template.instance().filetypes.get();

    let pendingFiles = _.find(ft, function(d) { return !masterJob.hasOwnProperty(d.id) });
    if (pendingFiles != undefined) {
        ft[_.indexOf(ft, pendingFiles)].isActive = true;
        Router.go('/upload/' + pendingFiles.id);
    } else {
        ft[0].isActive = true;
        Router.go('/upload/' + ft[0].id);
    }

    Template.instance().filetypes.set(ft);
});


Template.readCSV.helpers({
    schema() {
        return CollUploaderSchema.find({ owner: Meteor.userId() }).fetch();
    },
    currentSheetName() {
        let ft = Template.instance().filetypes.get(); // all file type
        let activeFiletype = _.find(ft, function(d) { return d.isActive }); // find active filetype
        Template.instance().currentSheetName.set(activeFiletype.name);
        return Template.instance().currentSheetName.get();
    },
    abortData() { return Template.instance().abortData.get() },
    files() {
        return Template.instance().files.get();
    },
    headers() {
        // if (Template.instance().headers.get().length == 0) {
        //     let ft = Template.instance().filetypes.get(); // all file type
        //     let activeFiletype = _.find(ft, function(d) { return d.isActive }); // find active filetype
        //     let header = _.chain(activeFiletype.schema._schema).reject(function(d, k) { return k == 'fileID' || k == 'owner' || k == 'username' }).map(function(d) { return d.label.toLowerCase() }).value();

        //     Template.instance().headers.set(header);
        // }
        return Template.instance().headers.get();
    },
    csvHeaders() {
        return Template.instance().csvHeaders.get();
    },
    // distance() {
    //     let res = this.csvHeaders[0];
    //     // // console.log(this.csvHeaders);
    //     let col = this.col;
    //     this.csvHeaders.forEach(function(d) {
    //         res = Levenshtein.get(col, d) < Levenshtein.get(col, res) ? d : res;
    //     });
    //     return res;
    // },
    previewRec() {
        return Template.instance().previewRec.get();
    },
    filetypes() {
        return Template.instance().filetypes.get();
    },
    mapping() {
        return Template.instance().mapping.get();
    },
    mappingWithOutHeader() {
        return Template.instance().mappingWithOutHeader.get();
    },
    mappingWithHeader() {
        return Template.instance().mappingWithHeader.get();
    },
    getJsonValues(obj) {
        return Object.values(obj);
    },
    getJsonKeys(obj) {
        return Object.keys(obj);
    },
    previewCollection() {

        let ft = Template.instance().filetypes.get(); // all file type
        let activeFiletype = _.find(ft, function(d) { return d.isActive }); // find active filetype
        let obj = CollUploadJobMaster.findOne({ owner: Meteor.userId(), masterJobStatus: 'running' });
        let data = [];
        if (obj != undefined && activeFiletype != undefined) {
            if (obj.hasOwnProperty(activeFiletype.id)) {
                data = activeFiletype.collection.find({ fileID: obj[activeFiletype.id].id }).fetch();
            }
        }
        Template.instance().previewCollection.set(data);
        return Template.instance().previewCollection.get();
    },
    fields: function() {
        if (Template.instance().previewCollection.get().length > 0) {
            let fields = Object.keys(Template.instance().previewCollection.get()[0]);
            let newFields = _.union({
                key: '_id',
                label: function(value, object) { return new Spacebars.SafeString("<input id='ckbSelectAll' type='checkbox'  />"); },
                fn: function(value, object) { return new Spacebars.SafeString("<input type='checkbox' class='chk' value='" + value + "' />"); },
                sortable: false,
            }, _.chain(fields).reject(function(d) { return d == '_id' || d == 'fileID' || d == 'owner' || d == 'username' }).map(function(d) {
                return {
                    key: d,
                    label: d,
                    fn: function(value, object) { return new Spacebars.SafeString('<div title="' + _.escape(value) + '">' + _.escape(value) + '</div>'); }
                }
            }).value());
            // console.log(newFields);

            return newFields;
        } else {
            return [];
        }
    },
    isActiveStep2() {
        let obj = CollUploadJobMaster.findOne({ owner: Meteor.userId(), masterJobStatus: 'running' });
        let ft = Template.instance().filetypes.get();

        return !_.chain(ft).filter(function(d) { return d.require }).map(function(d) { return d.id }).map(function(d) { return _.contains(_.keys(obj), d) }).contains(false).value();
    },
    isImagesTab() {
        return Router.current().params.id == "ProductImage";
    }
});

let updateJobMaster = function(filename, fileID, cb) {
    //return CollUploadJobMaster.findOne({ owner: Meteor.userId(),deleteAt:'',stepStatus:1 });
    let data = {};
    data[filename] = { id: fileID, schemaId: $("#dpdSchema").val(), validateStatus: 'pending', uploadStatus: 'completed', uplodedAt: new Date() };
    let Obj = CollUploadJobMaster.findOne({ owner: Meteor.userId(), masterJobStatus: 'running', stepStatus: 'upload_pending' });
    CollUploadJobMaster.upsert(Obj._id, { $set: data }, function() {
        cb();
    });
}

let insertOtherCSVData = function(data, fileID, collection,fileSchemaObj, cb) {
  console.log("validation data",data);
  let copedata = $.extend({}, data);
  let schemaObj = fileSchemaObj.schema;
  // console.log(schemaObj);
  let skipOptions = {"removeEmptyStrings":false,"skipCast": [ 'product_id','sr_no' ]}


  let result = schemaObj.validate( data, { skipCast: [ 'sr_no','product_id' ] }, function( err, newP, errors ){
    if(err)
    {
      // console.log("Err!");
      // console.log( err );
    } else {
      // console.log("Res!");
      // console.log( newP );
    }
  })
  // console.log(result)

  complexSchema.validate( p, { skipCast: [ 'age' ] }, function( err, newP, errors ){
    // ...
  });

  // collection.simpleSchema().namedContext().validate(data, skipOptions, function (err, newerP, errors) {
  //   if(err)
  //   {
  //     // console.log("Err!");
  //     // console.log( err );
  //   } else {
  //     if( errors.length ){
  //       // console.log("Validation errors!");
  //       // console.log( errors );
  //     } else {
  //       // console.log("newerP:");
  //       // console.log( newerP );
  //     }
  //   }
  // })

  // try {
  //   //data.sr_no = String(data.sr_no)
  //   //data.product_id = String(data.product_id)
  //   schemaObj.clean(data,{"autoConvert":true,"removeEmptyStrings":true,"skipCast": [ 'product_id','sr_no' ] })
  //   if(schemaObj.validate(data,{},{"removeEmptyStrings":false,"skipCast": [ 'product_id','sr_no' ]})) {
  //     let Obj = CollUploadJobMaster.findOne({ owner: Meteor.userId(), masterJobStatus: 'running', stepStatus: 'upload_pending' });
  //
  //     let ObjPI = CollProductInformation.findOne({ fileID: Obj.ProductInformation.id,'sku':data.sku});
  //     if(ObjPI[fileSchemaObj.id].length>0) {
  //       ObjPI[fileSchemaObj.id].push(data)
  //     } else {
  //       ObjPI[fileSchemaObj.id]=[];
  //       ObjPI[fileSchemaObj.id].push(data)
  //     }
  //     CollProductInformation.upsert(ObjPI._id, { $set: ObjPI }, function() {
  //       alert("data updated res");
  //         cb();
  //     });
  //   }
  // } catch(err) {
  //   let allowedValuesObj = '';
  //   $("#upload-csv-zone,#preview").hide();
  //   $("#handson-Zone-during-upload").show();
  //   $('.makeBlur').css("display","none");
  //   $('#buttonProceedNext').show().find('.content').text('Proceed To Next');
  //   $('#btnNext').hide();
  //   $("#errMessageFromSchema").text(err.message);
  //   $("#allowMessageFromSchema").text(allowedValuesObj);
  //   renderHandsonTable(copedata, Object.keys(copedata), 'hotErrorDataDuringUpload', err, fileID, collection, fileSchemaObj, cb);
  // }
}
// console.log("##########################",fileSchemaObj);
let insertCSVData = function(data, fileID, collection,fileSchemaObj, cb) {



    let t0,t1

    t0 = performance.now()
    console.log("====insertCSVData fun=1==", t0)
    console.log("***********",data,"***********");
    let copedata = $.extend({}, data);
    data['fileID'] = fileID;
    data['owner'] = Meteor.userId();
    data['username'] = Meteor.user().username;

    // if(fileSchemaObj.id!='ProductInformation') {
    //   insertOtherCSVData(data, fileID, collection,fileSchemaObj, cb);
    // }
    // else {
  // let options = {
  //   modifier: false,
  //   upsert:false
  // }
    // collection.validate(data,options,function(){
    //   if(!true){
    //     parser.pause();
    //   }
    // });
    // collection.simpleSchema().namedContext("insertForm").validate(data, {modifier: false},function(){
    //   console.log("....................validate method called..............")
    //   if(!true){
    //     parser.pause();
    //   }
    // });
    // var validateValue = fileSchemaObj.namedContext("collection");
    // if(!validateValue.isValid()){
    //   console.log("..........................................error");
    // }
    // console.log( validateValue,results.data[0].sku);

      console.log("&&&&&&&&&&&&&&&&",collection,"&&&&&&&&&&&&&&&&&&&&&");
      collection.insert(data,{ validationContext: "insertForm",mutate: true, modifier: false }, function(err, res) {
          if (err) {
              let allowedValuesObj = '';
              errFlag = false;
              if(!parserObj.paused()){
              parserObj.pause();
             }


              try {
                  let keyName = err.invalidKeys[0].name;
                  let schemaObj = fileSchemaObj.schema;
                  let typeObj = eval("schemaObj._schema." + keyName);

                  if (typeObj.type.definitions[0] && typeObj.type.definitions[0].allowedValues) {
                      allowedValuesObj = " [ Allowed Values : " + typeObj.type.definitions[0].allowedValues.join(", ") + " ]";
                      console.log(allowedValuesObj);
                  }
              } catch (e) {};
              $("#upload-csv-zone,#preview").hide();
              $("#handson-Zone-during-upload").show();
              $('.makeBlur').css("display","none");
              $('#buttonProceedNext').show().find('.content').text('Proceed To Next');
              $('#btnNext').hide();
              $("#errMessageFromSchema").text(err.message);
              $("#allowMessageFromSchema").text(allowedValuesObj);
              renderHandsonTable(copedata, Object.keys(copedata), 'hotErrorDataDuringUpload', err, fileID, collection, fileSchemaObj, cb);

          } else {
              cb();
              t1 = performance.now()
              console.log("====insertCSVData fun=2==", t1-t0);

          }

      });

    }



let errorRenderer = function(instance, td, row, col, prop, value, cellProperties) {
    Handsontable.renderers.TextRenderer.apply(this, arguments);
    td.style.border = "2px solid red";
    $(td).focus();
};

let getHandsonHeader = function(headers, invalidKeys) {
    let newHeaders = [];
    _.each(headers, function(val, inx) {
        if (_.find(invalidKeys, function(d) { return d.name == val; }) != undefined) {
            newHeaders.push({ colHeader: val, renderer: errorRenderer, data: val })
        } else {
            newHeaders.push({ colHeader: val, data: val })
        }
    });
    return newHeaders;
}
let objHandsontable;
let renderHandsonTable = function(dataObject, headers, eleName, error, fileID, collection, collectionId, cb) {
  // console.log("------------------------------------IN RENDERHANDSON TABLE -------------------------------------");
    if (objHandsontable != undefined) {
        objHandsontable.destroy();
    }
    let newHeaders = getHandsonHeader(headers, error.invalidKeys);
    //// console.log('newHeaders', newHeaders);
    let hotSettings = {
        data: dataObject,
        columns: newHeaders,
        stretchH: 'all',
        autoWrapRow: true,
        //height: 441,
        //maxRows: 22,
        rowHeaders: true,
        //colHeaders: getHeadersValues(headers),
        colHeaders: headers,
        afterChange: function(changes, source) {
            //updateErrorData(changes, source, dataObject, fileID);
            $("#buttonProceedNext").unbind('click').click(function() {
                // console.log('afterchange', dataObject);
                errFlag = true;
                $('.makeBlur').css("display","block");
                insertCSVData(dataObject, fileID, collection, collectionId, cb);
            });
        }
    };
    hotElement = document.querySelector('#' + eleName);

    objHandsontable = new Handsontable(hotElement, hotSettings);
}

Template.EditorPage.helpers({
    "editorOptions": function() {
        return {
            lineNumbers: true,
            mode: "javascript"
        }
    },

    "editorCode": function() {
        return "function(row){\n return row; \n};\n";
    }
});
Template.header.events({
    'click #login-buttons-logout': function(event) {
        location = 'http://localhost:3001/logout';
    }
});
Template.header.helpers({
    isCustomer() {
        let status = Meteor.userId() == "hi4v28wiizb8tHrrT";
        return status;
    },
    getCurrentRouter() {
        return Router.current().route.getName().toLowerCase();
    }
})
