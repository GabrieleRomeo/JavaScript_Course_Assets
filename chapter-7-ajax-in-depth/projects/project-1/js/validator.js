var validator = (function(window) {

    var v = {};

    var _ALPHA  = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var _reduce = Array.prototype.reduce;
    var _map    = Array.prototype.map;

    /*
     * Default Constraints. They can be specialized through the setConstraint
     * method
     */
    var _constraints = {
        firstName: {
            value: 'The First Name must be a non-empty string of at ' +
                    'least three characters'
        },
        lastName: {
            value: 'The Last Name must be a non-empty string of at ' +
                    'least three characters'
        },
        email: {
            value: 'Please provide a valid Email Address'
        },
        dateOfBirth: {
            value: 'Please provide a valid Birthday'
        },
        password: {
            value: 'The Password must contain from six to eight ' +
                   'characters'
        }
    };

    /**
     *  Creates an Object having attributes of the provided node
     *  and its constraint rule (if any)
     *
     * @param  {object} node A document Object node
     * @param  {string} name A custom name for the element's constraint
     *
     * @returns {object} A custom Node object with properties and methods useful
     *                   to manage it
     *
     * @returns {null} If the provided node does not exist
     */

    v.getNode = function(node, name) {

        if (!node || node.nodeType != 1) return null;

        var id   =  node.getAttribute('id') || node.getAttribute('name');
        var cstr = _constraints[id];

        if (!id) return null;

        if (!cstr) {
            _constraints[id] = {};
            // If the constraint provided exists, use it
            if (_constraints[name]) {
                _constraints[id]['value'] = _constraints[name]['value'];
            } else {
                _constraints[id]['value'] =  'Please fill this field';
            }

            cstr = _constraints[id];
        }

        /*
         * Sets default methods and properties for the constr object
         */

        cstr['check'] = function() {};

        /**
         * Retrieve the text of a constraint (if any)
         *
         * @param  {string} name The name of the constraint
         *
         * @returns {string} The description of the provided constraint
         */

        var getConstraint = function(name) {

            if (_constraints[name].value) {
                return _constraints[name].value;
            }

            return 'Constraint (' + name + ') undefined';
        };

        /**
         * Creates a constraint for a particular node. If a constraint with the
         * same name already exists, it sets the new value otherwise a new
         * constraint will be created.
         *
         * @param {string} value The constraint's value
         * @param  {Func} validatorFn A validator used to validate the constraint
         *
         * @returns {void}
         */

        var setConstraint = function(value, validatorFn) {

            if (!value) return false;

            // Set constraint's value
            this.constr.value = value;

            // Changes Custom Validity for inputs with the attribute required
            if (typeof this.node.getAttribute('required') === 'string') {
                this.node.setCustomValidity(value);
            }

            if (typeof validatorFn === 'function') {
                setConstraintValidator(validatorFn);
            }
        };

        /**
         * Sets a constraint validator for a particular node.
         *
         * @param  {Func} validatorFn A function used to validate the constraint
         *
         * @returns {void}
         */

        var setConstraintValidator = function(validatorFn) {

            var _self = this;

            if (typeof validatorFn === 'function') {

                _self.constr.check = function() {

                    var _node = _self.node;

                    /*
                     * If this input does not have the 'required' attribute and
                     * it does not contain any content, reset its validity
                     * so that it restores previous problems (if any) and skips
                     * the validatorFn function
                     */

                    if (typeof _node.getAttribute('required') !== 'string' &&
                               _node.value === '') {
                        _self.resetCustomValidity();
                    } else {
                        validatorFn(_self);
                    }
                };
            }
        };

        /**
         * Reset a custom validity and removes the class 'invalid' from
         * the original DOM node
         *
         * @param {string} customClassName An optional class name
         *
         * @returns {void}
         */

        var resetCustomValidity = function(customClassName) {

            var txt = customClassName || 'invalid';
            var node = this.node;
            var regExp = new RegExp(txt, 'ig');
            node.className = node.className.replace(regExp,'');
            node.setCustomValidity('');
        };

        /**
         * Sets the class 'invalid' to the original DOM node
         *
         * @returns {void}
         */

        var setInvalidClass = function () {
            var node = this.node;

            if (!v.contains(node.className, ['invalid'])) {
                node.className = node.className.trim() + ' invalid';
            }
        };


        // Public API
        return {
            node:                node, // reference to the node object
            constr:              cstr,
            getConstraint:       getConstraint,
            setConstraint:       setConstraint,
            setValidator:        setConstraintValidator,
            setInvalidClass:     setInvalidClass,
            resetCustomValidity: resetCustomValidity
        };
    };


    /**
     * Checks if the provided input is a valid email address
     *
     * It checks for the presence of duplicated dots inside the local and domain
     * parts.
     * This function does not use Regular Expressions
     *
     * @param  {string} input The string representing a valid email address.
     *
     * @returns {boolean} True or False
     */

    v.isEmailAddress = function(input) {

        if (!input) return false;

        var parts     = input.split('@');
        var minLength = parts.length === 2 || false;
        var local     = parts[0] && parts[0].length > 0 &&
                        !_isConsecutive(parts[0], '.')  || false;
        var domain    = parts[1] && !_isConsecutive(parts[1], '.') || false;


        return minLength && local && domain;
    };

    /**
     * Checks if the provided input is a valid italian phone number
     *
     * LANDLINE NUMBERS and MOBILE PHONES
     *
     * Phone numbers in Italy have variable length. There's no well established
     * convention about how to group digits or which symbol to use, but this is
     * hardly an issue since all the digits are always dialed.
     *
     * This evaluation shall take into account also of the country code (+39),
     * international prefix (00) and emergency or service numbers
     *
     * Valid numbers:
     *      Landline : 02-19838788, +3902-19838788, 003902-19838788
     *      Mobile   : 333-1111111, +39333-1111111, 0039333-1111111
     *
     * This function does not use Regular Expressions
     *
     * @param  {string} input The string representing a valid phone number.
     *
     * @returns {boolean} True or False
     */

    v.isPhoneNumber = function(input) {

        if (!input) return false;

        var _errorMsg;

        var COUNTRY_CODE        = '39',
            INTERNATIONAL_PRFX  = '00',
            SPECIALS = [112, 113, 115, 116, 117, 118, 1515, 1518, 1530],
            ZONES = {
                1: {
                    prefixes: ['010','011','0122','0123','0124','0125','0131',
                             '0141','015','0161','0163','0165','0166','0171',
                             '0183','0184','0185','0187']
                },
                2: {
                    prefixes: ['02']
                },
                3: {
                    prefixes: ['030','031','0321','0322','0324','0331','0332',
                             '0341','0342','0343','0344','0346','035','0362',
                             '0362','0363','0364','0365','0371','0372','0373',
                             '0375','0376','0382','039']
                },
                4: {
                    prefixes: ['040','041','0421','0422','0423','0424','0425',
                             '0426','0432','0434','0438','0444','0445','045',
                             '0461','0471','0481','049']
                },
                5: {
                    prefixes: ['050','051','0522','0521','0523','0532','0535',
                             '0536','0541','0543','0544','0545','0547','0549',
                             '055','0565','0571','0574','0575','0577','0583',
                             '0585','0586','059']
                },
                6: {
                    prefixes: ['06']
                },
                7: {
                    prefixes: ['070','071','0721','0731','0732','0733','0734',
                             '0735','0736','0737','075','0761','0765','0771',
                             '0773','0774','0775','0776','0783','0789','079']
                },
                8: {
                    prefixes: ['080','081','0823','0824','0825','0832','085',
                             '0861','0862','0865','0874','0881','0882','0883',
                             '0884','089']
                },
                9: {
                    prefixes: ['090','091','0921','0931','0932','0933','0924',
                             '0922','0925','0934','0941','0942','095','0961',
                             '0962','0963','07965','0974','0975','099','0984']
                }
            };

        var parts = input.split('-'),
            prefix  = parts[0],
            number  = parts[1];

        var intPrefix = (prefix.substr(0, 2) === INTERNATIONAL_PRFX);
        var countryC  = intPrefix ? prefix.substr(2, 2) : prefix.substr(1, 2);
        var isContryC = countryC === COUNTRY_CODE;
        var startAt = 1;
        var type;
        var zone;


        // Is this an emergency or service number?
        if (SPECIALS.indexOf(parseInt(input)) !== -1) {
            return true;
        }

        if (parts.length !== 2) {
            _errorMsg  =  'Invalid Phone Number\n';
            _errorMsg +=  'The prefix must be indicated with the - character\n';
            _errorMsg +=  'Valid examples:\n';
            _errorMsg +=  'Landlines:\n';
            _errorMsg +=  '\t02-19838788, +3902-19838788, 003902-19838788\n';
            _errorMsg +=  'Mobile phones:\n';
            _errorMsg +=  '\t333-1111111, +39333-1111111, 0039333-1111111';
            throw _errorMsg;
        }

        if (isContryC) {
            startAt  = 4;
        }
        if (intPrefix) {
            startAt = 5;
        }

        type  = prefix.charAt(startAt - 1);
        zone  = prefix.charAt(startAt);

        if (!typeof number === 'number') {
            return false;
        }

        if ( intPrefix && (!isContryC) ) {
            _errorMsg  =  'Invalid International prefix (';
            _errorMsg +=  INTERNATIONAL_PRFX + ')';
            _errorMsg += ' OR country code (+' + COUNTRY_CODE + ')';
            throw _errorMsg;
        }

        if ( prefix.indexOf('+') !== -1 && (!isContryC) ) {
            _errorMsg  = 'Invalid country code.\n';
            _errorMsg += 'Italy Contry Code (+' + COUNTRY_CODE +')';
            throw _errorMsg;
        }

        /*
         *  Telephone numbers in Italy
         *
         *  The number "0" identifies landlines:
         *      Landline numbers start with the digit 0 and are 6 to 10
         *      digits long
         *
         *  The number "3" identifies mobile phone numbers:
         *      The first 3 digits of the mobile phone numbers (prefix) identify
         *      the mobile network operator.
         *      Mobile phones are generally 10 digits long.
         */

        startAt -= 1;
        prefix   = prefix.substr(startAt, prefix.length);

        if (type === '0') { // landlines
            if (!ZONES[zone]) return false; // non-existent zone
            if (ZONES[zone].prefixes.indexOf(prefix) === -1) return false;
            if (number.length < 6 || number.length > 10) return false;

        } else if (type === '3') {
            // mobile phone
            if ((prefix.length + number.length) !== 10) return false;
        } else {
            // non-valid type - 0 for landlines 3 for mobile phones
            return false;
        }

        return true;
    };

    /**
     * Returns the input parameter text with all symbols removed.
     * Symbols refer to any non-alphanumeric character. A character is
     * considered alphanumeric if it matches one of the following:
     * a—z, A—Z, or 0—9. It ignores whitespace.
     *
     * @param  {string} input The string to analyze.
     *
     * @returns {string} The input parameter text with all symbols removed
     */

    v.withoutSymbols = _maybe(function(input) {
        return _map.call(input.split(''), function(item) {
            item = item.toLowerCase();
            return ((_ALPHA.indexOf(item) === -1) && item !== ' ') ? '' : item;
        }).join('');
    });

    /**
     * Checks if the input parameter text is a valid date.
     * For your purposes, a valid date is any string that can be turned into
     * a JavaScript Date Object.
     *
     * @param {string} or {date} input A value representing a valid Javascript
     *                                 date.
     *
     * @returns {boolean} True or False
     */

    v.isDate = function isDate(input) {

        var date = new Date(input);

        return !isNaN(date.getDate());
    };

    /**
     * Checks if the input parameter is a date that comes after the reference
     * date. Both the input and the reference can be strings or Date Objects.
     * This function relies on two valid dates; if two are not found,
     * it should throw a new error.
     *
     * @param {string} or {date} input A value representing a valid Javascript
     *                                 date.
     * @param {string} or {date} reference A value representing a valid
     *                                     Javascript date.
     *
     * @returns {boolean} True or False
     */

    v.isBeforeDate = function isBeforeDate(input, reference) {

        var d1 = new Date(input),
            d2 = new Date(reference);

        if (!this.isDate(d1)) throw 'Invalid Date';
        if (!this.isDate(d2)) throw 'Invalid Reference Date';

        return d1 < d2;
    };

    /**
     * Checks if the input parameter is a date that comes before the reference
     * date. Both the input and the reference can be strings or Date Objects.
     * This function relies on two valid dates; if two are not found,
     * it should throw a new error.
     *
     * @param {string} or {date} input A value representing a valid Javascript
     *                                 date.
     * @param {string} or {date} reference A value representing a valid
     *                                 Javascript date.
     *
     * @returns {boolean} True or False
     */

    v.isAfterDate = function isAfterDate(input, reference) {

        var d1 = new Date(input),
            d2 = new Date(reference);

        if (!this.isDate(d1)) throw 'Invalid Date';
        if (!this.isDate(d2)) throw 'Invalid Reference Date';

        return d1 > d2;
    };

    /**
     * Checks if the input parameter is a date that comes before today.
     * The input can be either a string or a Date Object.
     * This function relies on two valid dates; if two are not found,
     * it should throw a new error.
     *
     * @param {string} or {date} input A value representing a valid Javascript
     *                                 date.
     *
     * @returns {boolean} True or False
     */

    v.isBeforeToday = function isBeforeToday(input) {

        var d1 = new Date(input),
            d2 = new Date(),
            days;

        if (!this.isDate(d1)) throw 'Invalid Date';

        days = _diffInDays(d1, d2);

        return days < 0;
    };

    /**
     * Checks if the input parameter is a date that comes after today.
     * The input can be either a string or a Date Object.
     * This function relies on two valid dates; if two are not found,
     * it should throw a new error.
     *
     * @param {string} or {date} input A value representing a valid Javascript
     *                                 date.
     *
     * @returns {boolean} True or False
     */

    v.isAfterToday = function isAfterToday(input) {

        var d1 = new Date(input),
            d2 = new Date(),
            days;

        if (!this.isDate(d1)) throw 'Invalid Date';

        days = _diffInDays(d1, d2);

        return days > 0;
    };

    /**
     * Checks the input parameter and returns true if it is an empty string
     * a string with no length or characters that is represented as ""
     * or only contains whitespace(s).
     *
     * @param {string} input The string to analyze.
     *
     * @returns {boolean} True or False
     */

    v.isEmpty = function isEmpty(input) {

        if (!input) return true;

        return false;
    };

    /**
     * Checks if the input text parameter contains one or more of the words
     * within the words array. A word is defined as the following:
     * having undefined, whitespace, or punctuation before and after it.
     * The function is case-insensitive.
     *
     * @param {string} input The string to analyze.
     * @param {Array} words A list of words to check.
     *
     * @returns {boolean} True or False
     */

    v.contains = _maybe(function(input, words) {
        var wlen,
            inputList,
            i;

        // When the words list is not provided return false by default
        if (!_isArray(words)) return false;

        input = input.toLowerCase();
        wlen  = words.length;

        inputList = _map.call(input.split(''), function(item) {
            return ((_ALPHA.indexOf(item) === -1) && item !== ' ') ? ' ' : item;
        }).join('').split(' ');

        for (i = 0; i < wlen; i++) {
            if (inputList.indexOf(words[i].toLowerCase()) > -1) {
                return true;
            }
        }

        return false;
    });

    /**
     * Checks if the input text parameter does not contain any of the words
     * within the words array. A word is defined as the following:
     * having undefined, whitespace, or punctuation before and after it.
     * The function is case-insensitive.
     * A function like this could be used for checking blacklisted words.
     *
     * @param {string} input The string to analyze.
     * @param {Array} words A list of words to check.
     *
     * @returns {boolean} True or False
     */

    v.lacks = function(input, words) {
        return !v.contains.call(this, input, words);
    };

    /**
     * Checks that the input text parameter contains only strings found
     * within the strings array.
     * This function doesn’t use a strong word definition the way .contains and
     * .lacks does.
     * The function is case-insensitive.
     *
     * @param {string} input The string to analyze.
     * @param {Array} words A list of words to check.
     *
     * @returns {boolean} True or False
     */

    v.isComposedOf = _maybe(function(input, strings) {
        var result;

        // When the strings list is not provided return undefined by default
        if (!_isArray(strings)) return void 0;

        result = _map.call(strings, function(item) {
            return item.toLowerCase();
        }).reduce(function(prev, curr) {
            return prev.toLowerCase().split(curr).join('');
        }, input).trim();

        return result.length === 0;

    });

    /**
     * Checks if the input parameter’s character count is less than or
     * equal to the n parameter.
     *
     * @param {string} input The string to analyze.
     * @param {integer} n The upper threshold
     *
     * @returns {boolean} True or False
     */

    v.isLength = _maybe(function(input, n) {
        return input.length <= n;
    });

    /**
     * Checks if the input parameter’s character count is greater than or
     * equal to the n parameter.
     *
     * @param {string} input The string to analyze.
     * @param {integer} n The lower threshold
     *
     * @returns {boolean} True or False
     */

    v.isOfLength = _maybe(function(input, n) {
        return input.length >= n;
    });

    /**
     * Counts the number of words in the input parameter.
     *
     * @param {string} input The string to analyze.
     *
     * @returns {integer} The number of contained words
     */

    v.countWords = function(input) {

        if (!input) return 0;

        return _map.call(input.split(''), function(item) {
            return (_ALPHA.indexOf(item.toLowerCase()) === -1) ? ' ' : item;
        }).join('').trim().split(' ').length;
    };

    /**
     * Checks if the input parameter has a word count less than or equal
     * to the n parameter.
     *
     * @param {string} input The string to analyze.
     * @param {integer} n The upper threshold
     *
     * @returns {boolean} True or False
     */

    v.lessWordsThan = function lessWordsThan(input, n) {
        return this.countWords(input) <= n;
    };

    /**
     * Checks if the input parameter has a word count greater than or equal to
     * the n parameter.
     *
     * @param {string} input The string to analyze.
     * @param {integer} n The lower threshold
     *
     * @returns {boolean} True or False
     */

    v.moreWordsThan = function moreWordsThan(input, n) {
        return this.countWords(input) >= n;
    };

    /**
     * Checks that the input parameter matches all of the following:
     *
     * - input is greater than or equal to the floor parameter
     * - input is less than or equal to the ceil parameter.
     *
     * @param {value} input The value to analyze.
     * @param {integer} floor The lower threshold
     * @param {integer} ceil The upper threshold
     *
     * @returns {boolean} True or False
     */

    v.isBetween = _maybe(function(input, floor, ceil) {
        return (input >= floor && input <= ceil);
    });

    /**
     * Checks that the input parameter string is only composed of the following
     * characters:  a—z, A—Z, or 0—9.
     *
     * Unicode characters are intentionally disregarded.
     *
     * @param {string} input The value to analyze.
     *
     * @returns {boolean} True or False
     */

    v.isAlphanumeric = function(input) {

        if (!input) return true;

        return _reduce.call(input.split(''), function(prev, curr) {
            return (_ALPHA.indexOf(curr.toLowerCase()) === -1) ? false : prev;
        }, true);
    };

    /**
     * Checks if the input parameter is a credit card or bank card number.
     * A credit card number will be defined as four sets of four alphanumeric
     * characters separated by hyphens (-), or a single string of alphanumeric
     * characters (without hyphens).
     *
     * @param {string} input A valid credit card number
     *
     * @returns {boolean} True or False
     */

    v.isCreditCard = function isCreditCard(input) {

        if (!input) return false;

        var firstT = this.countWords(input) === 4 && input.indexOf('-') !== -1;

        if (firstT) {
            input = this.withoutSymbols(input);
        }

        if (!this.isAlphanumeric(input) || input.length !== 16) {
            return false;
        }

        return true;
    };

    /**
     * Checks if the input string is a hexadecimal color, such as #3677bb.
     * Hexadecimal colors are strings with a length of 7 (including the #),
     * using the characters 0—9 and A—F. isHex should also work on shorthand
     * hexadecimal colors, such as #333.
     * The input must start with a # to be considered valid.
     *
     * @param {string} input A valid Hexadecimal color
     *
     * @returns {boolean} True or False
     */

    v.isHex = function isHex(input) {

        if (!input) return false;

        var len = input.length;
        var chars = input.substr(1).split('');
        var that = this;

        if (input.charAt(0) !== '#') return false;
        if (len !== 4 && len !== 7) return false;

        return chars.reduce(function(prev, curr) {
            var chk1 = that.isBetween(curr, 'a', 'f');
            var chk2 = that.isBetween(curr, '0', '9');
            return (chk1 || chk2) ? prev : false;
        }, true);

    };

    /**
     * Checks if the input string is an RGB color, such as rgb(200, 26, 131).
     * An RGB color consists of:
     * - Three numbers between 0 and 255
     * - A comma between each number
     * - The three numbers should be contained within “rgb(” and “)“.
     *
     * @param {string} input A valid RGB color
     *
     * @returns {boolean} True or False
     */

    v.isRGB = function isRGB(input) {

        if (!input) return false;

        var sanitize = input.split('rgb(').join('').split(')').join('');
        var values   = sanitize.split(',');
        var that     = this;

        if (values.length !== 3) return false;

        return values.reduce(function(prev, curr) {
            return (that.isBetween(curr.trim(), '0', '255')) ? prev : false;
        }, true);
    };

    /**
     * Checks if the input string is an HSL color, such as hsl(122, 1, 1).
     * An HSL color consists of:
     * - Three numbers:
     *   • the first number, Hue, is between 0 and 360
     *   • the second and third numbers, Saturation and Lightness,
     *     are between 0 and 1
     * - A comma between each number
     * - The three numbers should be contained within “hsl(” and “)“.
     *
     * @param {string} input A valid HSL color
     *
     * @returns {boolean} True or False
     */

    v.isHSL = function isHSL(input) {

        if (!input) return false;

        var sanitize = input.split('hsl(').join('').split(')').join('');
        var values   = sanitize.split(',');

        if (values.length !== 3) return false;
        if (!(this.isBetween(values[0].trim(), '0', '360'))) return false;
        if (!(this.isBetween(values[1].trim(), '0', '1'))) return false;
        if (!(this.isBetween(values[2].trim(), '0', '1'))) return false;

        return true;
    };

    /**
     * Checks if the input parameter is a hex, RGB, or HSL color type.
     *
     * @param {string} input A valid color (Hex, RGB, HSL)
     *
     * @returns {boolean} True or False
     */

    v.isColor = function isColor(input) {

        if (!input) return false;

        return this.isHex(input) || this.isRGB(input) || this.isHSL(input);
    };

    /**
     * Checks if the input parameter has leading or trailing whitespaces or too
     * many spaces between words.
     * Leading refers to before while trailing refers to after.
     * This function will help validate cases where extra spaces were added
     * accidentally by the user.
     *
     * @param {string} input A string to analyze
     *
     * @returns {boolean} True or False
     */

    v.isTrimmed = function isTrimmed(input) {

        var chars = input.split(' ');

        return chars.reduce(function(prev, curr) {
            return (curr !=='') ? prev : false;
        }, true);
    };

    /**
     * Queries the DOM looking for the first HTML element
     * that matches the CSS query
     *
     * @param {string} selector A valid CSS selector
     *
     * @returns {object} The HTML object or null
     */

    v.$ = function (selector) {
        return window.document.querySelector(selector);
    };

    /**
     * Queries the DOM looking for all the HTML elements
     * that match the CSS query
     *
     * @param {string} selector A valid CSS selector
     *
     * @returns {object} The HTML object or null
     */

    v.$$ = function (selector) {
        return window.document.querySelectorAll(selector);
    };


    // ****** PRIVATE UTILITY FUNCTIONS ***********

    /**
     * It calls the fn function if and only if the provided parameters
     * are neither null nor undefined
     *
     * @param {Object} fn The function that could be applied
     *
     * @returns {value | void} The evalutation of fn or nothing
     */

    function _maybe(fn) {
        return function() {

            var i,
                len = arguments.length;

            if (len === 0) {
                return void 0;
            } else {

                for (i = 0; i < len; i++) {
                    if (!arguments[i]) return void 0;
                }
                // If all the parameters were provided to the original function,
                // applies it
                return fn.apply(this, arguments);
            }
        };
    }

    /**
     * Checks if the provided parameter is an Array
     *
     * @param {Array} arr An Array
     *
     * @returns {Boolean} True | False
     *
     */

    var _isArray = Array.isArray || function(arr) {

        return Object.prototype.toString.call(arr) === '[object Array]';

    };

    /**
     *  Check if the word arg is repeated within string
     *
     * @param  {string} string The string where you want to search for
     * @param  {string} word The character or word you are looking for
     *
     * @returns {boolean} True if word is consecutive, False otherwise
     */
    function _isConsecutive(string, word) {

        var substrings = string.split(word);
        for(var item in substrings) {
            if (!substrings[item]) return true;
        }
        return false;
    }

    /**
     *  Given two date it returns the difference between them in days
     *
     * @param  {d1} Date The first date
     * @param  {d2} Date The second date
     *
     * @returns {int} The difference in days
     */

    function _diffInDays(d1, d2){

        var diffInMilliSec = d1.getTime() - d2.getTime();
        var milliSecInAday = 24 * 60 * 60 * 1000; //total milli-seconds in a day

        return Math.floor(diffInMilliSec/milliSecInAday);
    }


    return v;

})(window);