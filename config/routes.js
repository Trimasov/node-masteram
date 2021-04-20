/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {



/***************************************************************************
*                                                                          *
* Make the view located at `views/homepage.ejs` your home page.            *
*                                                                          *
* (Alternatively, remove this and add an `index.html` file in your         *
* `assets` directory)                                                      *
*                                                                          *
***************************************************************************/

    "/": {
        view: "pages/evgeniyland"
    },

    "/masters": {
        view: "pages/masters",
        locals: {
            pageUse: "masters"
        }
    },

    "/customers": {
        view: "pages/customers",
        locals: {
            pageUse: "customers"
        }
    },

    // "/masters": {
    //     view: "pages/evgeniyland",
    //     locals: {
    //         pageUse: "masters"
    //     }
    // },

    "/politics": {
        view: "pages/politics",
    },

    "/m/:id": "CustomController.masterpage",

    "/remont": {
        view: "pages/evgeniyland",
        locals: {
            pageUse: "remont"
        }
    },

    "/stroyka": {
        view: "pages/evgeniyland",
        locals: {
            pageUse: "stroyka"
        }
    },

    "/krovlya": {
        view: "pages/evgeniyland",
        locals: {
            pageUse: "krovlya"
        }
    },

    "/2": {
        view: "pages/homepage2"
    },

    "/3": {
        view: "pages/homepage3"
    },

    "/22": {
        view: "pages/homepage22"
    },

    "/payment_success": {
        view: "pages/payment_success"
    },

    "/payment_reffuse": {
        view: "pages/payment_reffuse"
    }


/***************************************************************************
*                                                                          *
* More custom routes here...                                               *
* (See https://sailsjs.com/config/routes for examples.)                    *
*                                                                          *
* If a request to a URL doesn't match any of the routes in this file, it   *
* is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
* not match any of those, it is matched against static assets.             *
*                                                                          *
***************************************************************************/


//  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
//  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
//  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝



//  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
//  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
//  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝


//  ╔╦╗╦╔═╗╔═╗
//  ║║║║╚═╗║
//  ╩ ╩╩╚═╝╚═╝


};
