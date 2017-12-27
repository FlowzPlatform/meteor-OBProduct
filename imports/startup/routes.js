// Import needed templates
//import '../ui/body.js';
//import '../ui/history/history.js';
//import '../ui/landing/landing.js';

import { CollUploadJobMaster } from '../api/collections.js';


Router.route('/', {
    name: 'dashboard',
    template: 'dashboard'
});

Router.route('/uploaderdashboard', {
    name: 'landing',
    template: 'landing'
        //    this.render('landing');
});

Router.route('/upload', {
    name: 'upload',
    path: '/upload/:id?',
    template: 'readCSV',
    data: function() {
        return CollUploadJobMaster.findOne({ owner: Meteor.userId(), masterJobStatus: 'running' })
    },
    onBeforeAction: function() {
        let obj = CollUploadJobMaster.findOne({ owner: Meteor.userId(), masterJobStatus: 'running' })

        if (obj != undefined) {
            this.next();
        } else {
            Router.go('/uploaderdashboard');
        }
    }
});

// Router.route('/upload/:id', function() {
//     this.render('readCSV');
// });

Router.route('/history', {
    name: 'history',
    template: 'history'
});

Router.route('/validation', {
    name: 'validation',
    template: 'validation'
        //this.render('validation');
});

Router.route('/import', {
    name: 'import',
    template: 'import'

});

Router.route('/rfq', {
    name: 'rfq',
    template: 'rfq'
});


Router.route('/bidding', {
    name: 'bidding',
    template: 'bidding'
})

Router.route("viewBidsDetail", {
    path: "/bidding/:_id",
    // waitOn: function() {
    //   return [subscribe('posts')];
    // },
    data: function() {
        console.log(Posts.findOne(new Meteor.Collection.ObjectID(this.params._id)));
        return {
            viewDetails: Posts.findOne(new Meteor.Collection.ObjectID(this.params._id), {
                sort: {
                    createdAt: -1
                }
            })
        }
    }
});

Router.route('/allBids', {
    name: 'allBids',
    template: 'allBids'
})

// return this.route("dashboard", {
//   path: "/dashboard",
//   waitOn: function() {
//     return [subs.subscribe('posts'), subs.subscribe('comments'), subs.subscribe('attachments')];
//   },
//   data: function() {
//     return {
//       posts: Posts.find({'owner' : Meteor.userId()}, {
//         sort: {
//           createdAt: -1
//         }
//       }).fetch()
//     };
//   }
// });

Router.route('/myAccount', function() {
    //console.log(Router.current().params.query)
    var userobject = atob(Router.current().params.query.id).split('||');
    //console.log(this, this.query.id);
    Meteor.loginWithPassword(userobject[0], userobject[1]);
    Router.go('/rfq');
});