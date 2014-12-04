webApp.controller('sendCryptiController', ["$scope", "sendCryptiModal", "$http", "userService", function ($scope, sendCryptiModal, $http, userService) {
    $scope.accountValid = true;
    $scope.fromServer = "";
    $scope.maxlength = 8;
    $scope.onlyNumbers = /^-?\d*(\.\d+)?$/;
    $scope.secondPassphrase = userService.secondPassphrase;


    Number.prototype.roundTo = function( digitsCount ){
        var digitsCount = typeof digitsCount !== 'undefined' ? digitsCount : 2;
        var s = String(this);
        if (s.indexOf('e') < 0) {
            var e = s.indexOf('.');
            if (e == -1) return this;
            var c = s.length - e - 1;
            if (c < digitsCount) digitsCount = c;
            var e1 = e + 1 + digitsCount;
            var d = Number(s.substr(0, e) + s.substr(e + 1, digitsCount));
            if (s[e1] > 4) d += 1;
            d /= Math.pow(10, digitsCount);
            return d.valueOf();
        } else {
            return this.toFixed(digitsCount);
        }
    }

    Math.roundTo = function( number ,digitsCount){
        number = Number(number);
        return number.roundTo(digitsCount).valueOf();
    }

    $scope.close = function () {
        if ($scope.destroy) {
            $scope.destroy();
        }

        sendCryptiModal.deactivate();
    }

    $scope.moreThanEightDigits = function(number) {
        if (number.indexOf(".") < 0) {
            return false;
        }
        else{
            if(number.split('.')[1].length > 8){
                return true;
            }
            else{
                return false;
            }
        }
    }

    $scope.recalculateFee = function ($event) {
        if (!$scope.amount || isNaN(parseFloat($scope.amount))) {
            $scope.fee = "";
        } else {
            if ($scope.amount.indexOf('.') >= 0) {
                var strs = $scope.amount.split('.');
                $scope.maxlength = strs[0].length + 9;
            }
            // calculate fee.
            var fee = parseInt($scope.amount * 100000000 / 100 * $scope.currentFee) / 100000000; //($scope.amount / 100 * $scope.currentFee).roundTo(8);

            if ($scope.amount == 0) {
                $scope.fee = 0;
            } else if (parseFloat(fee) == 0) {
                fee = "0.00000001";
                $scope.fee = fee;
            } else {
                $scope.fee = fee.toFixed(8);
            }

			if (isNaN($scope.fee)) {
				$scope.fee = "";
			}
        }
    }


    $scope.accountChanged = function (e) {
        var string = $scope.to;

        if (!string) {
            return;
        }

        if(string[string.length - 1] == "D" || string[string.length - 1] == "C"){
            var isnum = /^\d+$/.test(string.substring(0,string.length-1));
            if(isnum && string.length-1>=1 && string.length-1<=20){
                $scope.accountValid = true;
            }
            else{
                $scope.accountValid = false;
            }
        }
        else{
            $scope.accountValid = false;
        }
    }

    $scope.moreThanEightDigits = function (number) {
        if (number.toString().indexOf(".") < 0) {
            return false;
        }
        else{
            if(number.toString().split('.')[1].length>8){
                return true;
            }
            else{
                return false;
            }
        }
    }

    $scope.getCurrentFee = function () {
        $http.get("/api/getFee", { params : { accountId : userService.address }})
            .then(function (resp) {
                $scope.currentFee = resp.data.fee;
            });
    }

    $scope.convertXCR = function (currency) {
        currency = String(currency);

        var parts = currency.split(".");

        var amount = parts[0];

        if (parts.length == 1) {
            var fraction = "00000000";
        } else if (parts.length == 2) {
            if (parts[1].length <= 8) {
                var fraction = parts[1];
            } else {
				$scope.amountError = true;
				return 0;
            }
        } else {
			$scope.amountError = true;
			return;
        }

        for (var i = fraction.length; i < 8; i++) {
            fraction += "0";
        }

        var result = amount + "" + fraction;

        if (!/^\d+$/.test(result)) {
			$scope.amountError = true;
			return 0;
        }

        //remove leading zeroes
        result = result.replace(/^0+/, "");

        if (result === "") {
            result = "0";
        }

        return parseInt(result);
    }

    $scope.sendCrypti = function () {
		$scope.amountError = false;

        if ($scope.convertXCR($scope.fee) + $scope.convertXCR($scope.amount) > userService._unconfirmedBalance) {
			$scope.amountError = true;
			return;
		}

		if ($scope.amountError) {
			return;
		}

        var data = {
            secret: $scope.secretPhrase,
            amount: $scope.convertXCR($scope.amount),
            recipient: $scope.to,
            accountAddress: userService.address,
            amountIsInteger : true
        };

        if ($scope.secondPassphrase) {
            data.secondPhrase = $scope.secondPhrase;
        }

        if (!$scope.amountError) {
            $http.post("/api/sendFunds", data).then(function (resp) {
                if (resp.data.error) {
                    $scope.fromServer = resp.data.error;
                }
                else {
                    if ($scope.destroy) {
                        $scope.destroy();
                    }

                    sendCryptiModal.deactivate();
                }
            });
        }
    }
    $scope.getCurrentFee();
}]);