  import { Meteor } from 'meteor/meteor';
  import { Template } from 'meteor/templating';
  import { ReactiveDict } from 'meteor/reactive-dict';
  import { ReactiveVar } from 'meteor/reactive-var';


  import './rfq.html';

  import { CollCloseOutPromoRFQSent } from '../../api/collections.js';
  import { CollCloseOutPromoRFQDiscussion } from '../../api/collections.js';

  Template.registerHelper('formatId', function(data) {
      return (data && data._str) || data;
  });

  Template.rfq.events({
      'click .rfq_id': function(event, template) {
          let currentEl = event.currentTarget;
          $('.rfq-view .nav li').removeClass('active');
          $(currentEl).addClass('active');
          let rfqId = $(currentEl).attr('data-id');
          getDiscussion(rfqId, template);
      },
      'click #btnReply': function(event, template) {
          replay(template);
      },
      'click #btnApprove': function(event, template) {
          let activeRfq = template.rfqdiscussion.get();
          CollCloseOutPromoRFQSent.update(activeRfq.rfqId, { $set: { Status: 'Approved' } });
          toastr.success("Successfully Approved.");
      },
      'click #btnReject': function(event, template) {
          swal({
                  title: "Are you sure?",
                  text: "Are you sure you want to reject this RFQ?",
                  type: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#DD6B55",
                  confirmButtonText: "Yes",
                  closeOnConfirm: true
              },
              function() {
                  let activeRfq = template.rfqdiscussion.get();
                  CollCloseOutPromoRFQSent.update(activeRfq.rfqId, { $set: { Status: 'Rejected' } });
                  toastr.success("Successfully Rejected.");
              });

      }
  });

  let replay = function(template) {
      let txtReply = tinyMCE.get('txtReply').getContent();
      if (txtReply.trim() != '') {
          let activeRfq = template.rfqdiscussion.get();
          let replyMessage = {
              from: Meteor.userId(),
              message: txtReply,
              to: CollCloseOutPromoRFQSent.find({ _id: activeRfq._id }).OwnerId,
              created: new Date()
          }
          activeRfq.discussion.push(replyMessage);
          CollCloseOutPromoRFQDiscussion.update({ _id: activeRfq._id }, { $push: { discussion: replyMessage } }, function(error, response) {
              let data = CollCloseOutPromoRFQDiscussion.findOne(activeRfq._id);
              console.log('inner', data);
              template.rfqdiscussion.set(data);
              tinyMCE.get('txtReply').setContent('');
          });
          console.log('outer')
              //var oid = new Meteor.Collection.ObjectID(activeRfq._id);
              //let data = CollCloseOutPromoRFQDiscussion.findOne(oid);


          //   saveReply(activeRfq, template, function() {
          //       template.rfqdiscussion.set(activeRfq);
          //       tinyMCE.get('txtReply').setContent('');
          //   })
      }
  }

  let saveReply = function(updatedRfq, template, cb) {
      let bulkRows = [{ "update": { "_id": updatedRfq._id, "_type": "discussions", "_index": "rfq" } }, { "doc": { "discussion": updatedRfq._source.discussion } }];
      let bulkRowsString = bulkRows.map(function(row) {
          return JSON.stringify(row);
      }).join("\n") + "\n"

      $.ajax({
          url: Meteor.settings.public.elasticsearch.host + "/_bulk",
          type: "POST",
          xhrFields: {
              withCredentials: true
          },
          //dataType: "application/json; charset=utf-8",
          data: bulkRowsString,
          dataType: "text",
          username: Meteor.settings.public.elasticsearch.username, // Most SAP web services require credentials
          password: Meteor.settings.public.elasticsearch.password,
          success: function(response) { if (!response.errors) { cb(); } },
          error: function(xhr, ajaxOptions, thrownError) {},
      });
  }

  let getDiscussion = function(rfqId, template) {
      var oid = new Meteor.Collection.ObjectID(rfqId);
      let data = CollCloseOutPromoRFQDiscussion.findOne(oid);
      console.log('discussion', data)
      template.rfqdiscussion.set(data);
  }

  Template.tinymce.onRendered(function() {
      console.log($(".tinymce"));
      for (var i = tinymce.editors.length - 1; i > -1; i--) {
          var ed_id = tinymce.editors[i].id;
          tinyMCE.execCommand("mceRemoveEditor", true, ed_id);
      }

      tinymce.init({
          selector: '.tinymce',
          skin_url: '/packages/teamon_tinymce/skins/lightgray',
          height: 200,
          menubar: false,
          plugins: [
              'advlist autolink lists link image charmap print preview anchor',
              'searchreplace visualblocks code fullscreen',
              'insertdatetime media table contextmenu paste code'
          ],
          toolbar: 'undo redo | insert | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
          content_css: '//www.tinymce.com/css/codepen.min.css'
      });
  })

  Template.rfq.onCreated(function() {
      let rfqdiscussionData = {}
          //   let data = CollCloseOutPromoRFQDiscussion.find({ sid: Meteor.userId() }).fetch();
          //   if (Meteor.userId() != "hi4v28wiizb8tHrrT") {
          //       let rfqSent = CollCloseOutPromoRFQSent.find({ OwnerId: Meteor.userId() }).fetch();
          //       let owenerId = _.map(rfqSent, function(d) { return d._id });
          //       data = CollCloseOutPromoRFQDiscussion.find({ rfqId: { $in: owenerId } }).fetch();
          //   }
          //   if (data.length > 0) {
          //       rfqdiscussionData = data[0];
          //   }

      this.rfqdiscussion = new ReactiveVar(rfqdiscussionData);
  })

  Template.rfq.helpers({
      rfq() {
          let data = CollCloseOutPromoRFQDiscussion.find({ sid: Meteor.userId() }).fetch();
          if (Meteor.userId() != "hi4v28wiizb8tHrrT") {
              let rfqSent = CollCloseOutPromoRFQSent.find({ OwnerId: Meteor.userId() }).fetch();
              let owenerId = _.map(rfqSent, function(d) { return d._id });
              data = CollCloseOutPromoRFQDiscussion.find({ rfqId: { $in: owenerId } }).fetch();
          }
          return data;
      },
      rfqdiscussion() {
          return Template.instance().rfqdiscussion.get();
      },
      rfqStatusIcon(rfqId) {
          let data = CollCloseOutPromoRFQSent.findOne({ _id: rfqId });
          let icon = "";
          if (data != undefined) {
              switch (data.Status) {
                  case "Approved":
                      icon = "text-suucess fa fa-check"
                      break;
                  case "Rejected":
                      icon = "text-danger fa fa-ban"
                      break;
              }
          }
          return icon;
      },
      getUsername(userid) {
          //console.log('id', CollCloseOutPromoRFQDiscussion.find(id));
          return Meteor.users.findOne(userid).username;
      },
      StatusCheck(id, activeid) {
          return ((id && id._str) || id) == ((activeid && activeid._str) || activeid);
      },
      isCustomer() {
          let status = Meteor.userId() != "hi4v28wiizb8tHrrT";
          return status;
      },
      isPending(rfqId) {
          let data = CollCloseOutPromoRFQSent.findOne({ _id: rfqId });
          let status = "";
          if (data != undefined) {
              status = (data.Status == "Pending");
              return status;
          }
          return false;
      },

  });