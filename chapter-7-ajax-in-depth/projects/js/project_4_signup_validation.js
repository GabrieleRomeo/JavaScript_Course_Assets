'use strict';

document.addEventListener('DOMContentLoaded', function (e) {

    var valid = validator,
        $     = valid.$;

    var signupForm  = $('#signupForm');

    var inputs = {
        firstName:  valid.getNode($('#firstName'),'firstName'),
        lastName:   valid.getNode($('#lastName'),'LastName'),
        email:      valid.getNode($('#email')),
        birthD:     valid.getNode($('#birthD'), 'dateOfBirth'),
        password:   valid.getNode($('#password'), 'password')
    };

    /*
     * For each input, defines a particular Validator function that must
     * be satisfied to proceed further.
     */

    inputs.firstName.setValidator(function(elem){

        var constr = elem.constr;
        var value  = elem.node.value;

        if (valid.isLength(value, 2)) {
            elem.node.setCustomValidity(constr.value);
        } else {
            elem.resetCustomValidity();
        }

    });

    inputs.lastName.setValidator(function(elem){

        var constr = elem.constr;
        var value  = elem.node.value;

        if (valid.isLength(value, 2)) {
            elem.node.setCustomValidity(constr.value);
        } else {
            elem.resetCustomValidity();
        }

    });

    inputs.email.setValidator(function(elem){

        var constr = elem.constr;
        var value  = elem.node.value;

        try {
            if (!valid.isEmailAddress(value)) {
                elem.node.setCustomValidity(constr.value);
            } else {
                elem.resetCustomValidity();
            }
        } catch (err) {
            throw err;
        }

    });

    inputs.birthD.setValidator(function(elem){

        var constr = elem.constr;
        var value  = elem.node.value;

        try {
            if (!valid.isBeforeToday(value)) {
                elem.node.setCustomValidity(constr.value);
            } else if (calculateAge(value) < 16) {
                elem.node.setCustomValidity('The minimum age of 16 years ' +
                                            'is required');
            } else {
                elem.resetCustomValidity();
            }
        } catch (err) {
            elem.node.setCustomValidity(constr.value);
        }

    });

    inputs.password.setValidator(function(elem){

        var constr = elem.constr;
        var value  = elem.node.value;

        try {
            if (valid.isLength(value, 6)) {
                elem.node.setCustomValidity(constr.value);
            } else {
                elem.resetCustomValidity();
            }
        } catch (err) {
            elem.node.setCustomValidity(constr.value);
        }

    });


    /*
     * Defines an initial custom validity for each input
     * By default, they are all invalid
     */

    for (var input in inputs) {
        if (inputs.hasOwnProperty(input)) {
            if (inputs[input].constr.isRequired) {
                inputs[input].elem.node.setCustomValidity(
                                              inputs[input].constr.constrValue);
            }

          // Defines a custom event listener for each input object
            (function(input) {
                input.node.addEventListener('change', function () {
                    var constr  = input.constr;
                    input.setInvalidClass();
                    constr.check();
                });
            })(inputs[input]);
        }
    }

    signupForm.addEventListener('submit', function (event) {

        // Check the inputs validity. If at least one input is invalid, stop
        // the form
        for (var input in inputs) {
            if (inputs.hasOwnProperty(input)) {
                if (!inputs[input].node.validity.valid) {
                    event.preventDefault();
                }
            }
        }

    }, false);

  /********************************************************
   *                                                      *
   *           HELPERS AND UTILITY FUNCTIONS              *
   *                                                      *
   *******************************************************/


    function calculateAge(date) {

        if (!valid.isDate(date)) return false;

        var birthDate = new Date(date);
        var today     = new Date();

        function diffInDays(d1, d2){

            //the absolute difference of d1 and d2 in milli-seconds
            var diffInMilliSec = Math.abs(d1.getTime() - d2.getTime());
            var milliSecInAday = 24 * 60 * 60 * 1000; //milli-seconds in a day

            return Math.floor(diffInMilliSec/milliSecInAday);
        }

        return Math.floor(diffInDays(birthDate, today) / 365);
    }

});