/*Copyright (c) 2002 Cynthia Brewer, Mark Harrower, and The Pennsylvania State University.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.


Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions as source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. The end-user documentation included with the redistribution, if any, must include the following acknowledgment:
This product includes color specifications and designs developed by Cynthia Brewer (http://colorbrewer.org/).
Alternately, this acknowledgment may appear in the software itself, if and wherever such third-party acknowledgments normally appear.
4. The name "ColorBrewer" must not be used to endorse or promote products derived from this software without prior written permission. 
For written permission, please contact Cynthia Brewer at cbrewer@psu.edu.
5. Products derived from this software may not be called "ColorBrewer", nor may "ColorBrewer" appear in their name, without prior written permission of Cynthia Brewer.
*/

ColorBrewer = {};

(function() {

var schemes = {
    "qualitative":{"Accent":[[127,201,127],[190,174,212],[253,192,134],[255,255,153],[56,108,176],[240,2,127],[191,91,23],[102,102,102]],
                   "Dark2":[[27,158,119],[217,95,2],[117,112,179],[231,41,138],[102,166,30],[230,171,2],[166,118,29],[102,102,102]],
	           "Paired":[[166,206,227],[31,120,180],[178,223,138],[51,160,44],[251,154,153],[227,26,28],[253,191,111],[255,127,0],[202,178,214],[106,61,154],[255,255,153],[177,89,40]],
	           "Pastel1":[[251,180,174],[179,205,227],[204,235,197],[222,203,228],[254,217,166],[255,255,204],[229,216,189],[253,218,236],[242,242,242]],
                   "Pastel2":[[179,226,205],[253,205,172],[203,213,232],[244,202,228],[230,245,201],[255,242,174],[241,226,204],[204,204,204]],
	           "Set1":[[228,26,28],[55,126,184],[77,175,74],[152,78,163],[255,127,0],[255,255,51],[166,86,40],[247,129,191],[153,153,153]],
	           "Set2":[[102,194,165],[252,141,98],[141,160,203],[231,138,195],[166,216,84],[255,217,47],[229,196,148],[179,179,179]],
	           "Set3":[[141,211,199],[255,255,179],[190,186,218],[251,128,114],[128,177,211],[253,180,98],[179,222,105],[252,205,229],[217,217,217],[188,128,189],[204,235,197],[255,237,111]]},
    "sequential":{"Blues":[[247,251,255],[222,235,247],[198,219,239],[158,202,225],[107,174,214],[66,146,198],[33,113,181],[8,81,156],[8,48,107]],
                  "BuGn":[[247,252,253],[229,245,249],[204,236,230],[153,216,201],[102,194,164],[65,174,118],[35,139,69],[0,109,44],[0,68,27]],
                  "BuPu":[[247,252,253],[224,236,244],[191,211,230],[158,188,218],[140,150,198],[140,107,177],[136,65,157],[129,15,124],[77,0,75]],
                  "GnBu":[[247,252,240],[224,243,219],[204,235,197],[168,221,181],[123,204,196],[78,179,211],[43,140,190],[8,104,172],[8,64,129]],
                  "Greens":[[247,252,245],[229,245,224],[199,233,192],[161,217,155],[116,196,118],[65,171,93],[35,139,69],[0,109,44],[0,68,27]],
                  "Greys":[[255,255,255],[240,240,240],[217,217,217],[189,189,189],[150,150,150],[115,115,115],[82,82,82],[37,37,37],[0,0,0]],
                  "Oranges":[[255,245,235],[254,230,206],[253,208,162],[253,174,107],[253,141,60],[241,105,19],[217,72,1],[166,54,3],[127,39,4]],
                  "OrRd":[[255,247,236],[254,232,200],[253,212,158],[253,187,132],[252,141,89],[239,101,72],[215,48,31],[179,0,0],[127,0,0]],
                  "PuBu":[[255,247,251],[236,231,242],[208,209,230],[166,189,219],[116,169,207],[54,144,192],[5,112,176],[4,90,141],[2,56,88]],
                  "PuBuGn":[[255,247,251],[236,226,240],[208,209,230],[166,189,219],[103,169,207],[54,144,192],[2,129,138],[1,108,89],[1,70,54]],
                  "PuRd":[[247,244,249],[231,225,239],[212,185,218],[201,148,199],[223,101,176],[231,41,138],[206,18,86],[152,0,67],[103,0,31]],
                  "Purples":[[252,251,253],[239,237,245],[218,218,235],[188,189,220],[158,154,200],[128,125,186],[106,81,163],[84,39,143],[63,0,125]],
                  "RdPu":[[255,247,243],[253,224,221],[252,197,192],[250,159,181],[247,104,161],[221,52,151],[174,1,126],[122,1,119],[73,0,106]],
	          "Reds":[[255,245,240],[254,224,210],[252,187,161],[252,146,114],[251,106,74],[239,59,44],[203,24,29],[165,15,21],[103,0,13]],
                  "YlGn":[[255,255,229],[247,252,185],[217,240,163],[173,221,142],[120,198,121],[65,171,93],[35,132,67],[0,104,55],[0,69,41]],
	          "YlGnBu":[[255,255,217],[237,248,177],[199,233,180],[127,205,187],[65,182,196],[29,145,192],[34,94,168],[37,52,148],[8,29,88]],
	          "YlOrBr":[[255,255,229],[255,247,188],[254,227,145],[254,196,79],[254,153,41],[236,112,20],[204,76,2],[153,52,4],[102,37,6]],
	          "YlOrRd":[[255,255,204],[255,237,160],[254,217,118],[254,178,76],[253,141,60],[252,78,42],[227,26,28],[189,0,38],[128,0,38]]},
    "divergent":{"BrBG":[[84,48,5],[140,81,10],[191,129,45],[223,194,125],[246,232,195],[245,245,245],[199,234,229],[128,205,193],[53,151,143],[1,102,94],[0,60,48]],
                 "PiYG":[[142,1,82],[197,27,125],[222,119,174],[241,182,218],[253,224,239],[247,247,247],[230,245,208],[184,225,134],[127,188,65],[77,146,33],[39,100,25]],
	         "PRGn":[[64,0,75],[118,42,131],[153,112,171],[194,165,207],[231,212,232],[247,247,247],[217,240,211],[166,219,160],[90,174,97],[27,120,55],[0,68,27]],
                 "PuOr":[[127,59,8],[179,88,6],[224,130,20],[253,184,99],[254,224,182],[247,247,247],[216,218,235],[178,171,210],[128,115,172],[84,39,136],[45,0,75]],
	         "RdBu":[[103,0,31],[178,24,43],[214,96,77],[244,165,130],[253,219,199],[247,247,247],[209,229,240],[146,197,222],[67,147,195],[33,102,172],[5,48,97]],
	         "RdGy":[[103,0,31],[178,24,43],[214,96,77],[244,165,130],[253,219,199],[255,255,255],[224,224,224],[186,186,186],[135,135,135],[77,77,77],[26,26,26]],
	         "RdYlBu":[[165,0,38],[215,48,39],[244,109,67],[253,174,97],[254,224,144],[255,255,191],[224,243,248],[171,217,233],[116,173,209],[69,117,180],[49,54,149]],
	         "RdYlGn":[[165,0,38],[215,48,39],[244,109,67],[253,174,97],[254,224,139],[255,255,191],[217,239,139],[166,217,106],[102,189,99],[26,152,80],[0,104,55]],
	         "Spectral":[[158,1,66],[213,62,79],[244,109,67],[253,174,97],[254,224,139],[255,255,191],[230,245,152],[171,221,164],[102,194,165],[50,136,189],[94,79,162]]}
};

ColorBrewer.sequential = function(opts) {
    opts = _.defaults(opts || {}, {
        alpha: 1,
        min: 0,
        max: 1
    });
    if (_.isUndefined(opts.name))
        throw "'name' is a required option";
    var a = schemes.sequential[opts.name];
    if (_.isUndefined(a))
        throw "Unknown sequential colormap " + opts.name;
    var range = _.map(a, function(lst) {
        return Shade.vec(lst[0] / 255, lst[1]/255, lst[2]/255, opts.alpha);
    });
    var us = _.map(range, function(v, i) {
        return i / (range.length - 1);
    });
    return Shade.Scale.linear({
        domain: _.map(us, function(u) { return Shade.mix(opts.min, opts.max, u); }),
        range: range
    });
};

ColorBrewer.qualitative = function(opts) {
    opts = _.defaults(opts || {}, {
        alpha: 1
    });
    if (_.isUndefined(opts.name))
        throw "'name' is a required option";
    var a = schemes.qualitative[opts.name];
    if (_.isUndefined(a))
        throw "Unknown qualitative colormap " + opts.name;
    function lookup(i) {
        if (_.isUndefined(opts.domain)) {
            return a[i];
        }
        return a[opts.domain[i]];
    }
    var range = _.map(a, function(unused, i) {
        lst = lookup(i);
        return Shade.vec(lst[0] / 255, lst[1]/255, lst[2]/255, opts.alpha);
    });
    return Shade.Scale.ordinal({range: range});
};

ColorBrewer.diverging = function(opts) {
    opts = _.defaults(opts || {}, {
        alpha: 1,
        low: -1,
        zero: 0,
        high: 1
    });
    if (_.isUndefined(opts.name))
        throw "'name' is a required option";
    var a = schemes.diverging[opts.name];
    if (_.isUndefined(a))
        throw "Unknown diverging colormap " + opts.name;
    var range = _.map(a, function(lst) {
        return Shade.vec(lst[0] / 255, lst[1]/255, lst[2]/255, opts.alpha);
    });
    
    var map1 = Shade.Scale.linear({
        domain: [opts.low, opts.zero, opts.high],
        range: [0, (range.length - 1) / 2, range.length - 1]
    });

    var map2 = Shade.Scale.linear({domain: _.range(range.length),
                                   range: range});
    return Shade(_.compose(map2, map1));
};

})();
