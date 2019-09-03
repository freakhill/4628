var Hack = {};

Hack.DATA_KEY = "o_shift_data"; // overtime shift data

Hack.get = function() {
    var script;
    var waitLoadScriptCount = 0;

    if (!window.jQuery) {
        script = document.createElement("script");
        script.setAttribute("src", "//code.jquery.com/jquery-1.11.3.min.js");
        document.body.appendChild(script);
    }
    if (!window.moment) {
        script = document.createElement("script");
        script.setAttribute("src", "//cdnjs.cloudflare.com/ajax/libs/moment.js/2.10.6/moment.min.js");
        document.body.appendChild(script);
    }

    (function onLoadScript() {
        if (!window.jQuery || !window.moment) {
            if (waitLoadScriptCount > 5) {
                alert('scriptの読み込みに失敗しました。');
                return;
            }
            setTimeout(onLoadScript, 1000);
            waitLoadScriptCount++;
            return;
        }

        var $ = window.jQuery;
        var moment = window.moment;

        var year = $('#kensaku select[name="Date_Year"]').val();
        var month = $('#kensaku select[name="Date_Month"]').val();
        var data = [];

        // 土日抜いた。残業対象外な気がする。制度ようわからん！
        $('#submit_form0 > table tr.bgcolor_white').each(function() {
            var $this = $(this);
            var day = $.trim($this.find('td:eq(0)').text());
            if (day.length === 1) {
                day = '0' + day;
            }
            var endTime = $.trim($this.find('td:eq(6)').text());

            if (!endTime) {
                return;
            }

            var endHour = endTime.split(':')[0];
            var endHourInt = +endHour;
            var endMin = endTime.split(':')[1];
            var endMinInt = +endMin;

            if (endHourInt === 18) {
                if (endMinInt > 30) {
                    data.push({
                        target: {
                            year: year,
                            month: month,
                            day: day
                        },
                        result: {
                            year: year,
                            month: month,
                            day: day,
                            hour: endHour,
                            min: endMin
                        }
                    });
                }
            } else if (19 <= endHourInt && endHourInt <= 23) {
                data.push({
                    target: {
                        year: year,
                        month: month,
                        day: day
                    },
                    result: {
                        year: year,
                        month: month,
                        day: day,
                        hour: endHour,
                        min: endMin
                    }
                });
            } else if (0 <= endHourInt && endHourInt <= 9) {
                var dateMoment = moment([year, month, day].join('-')).add(1, 'd');

                data.push({
                    target: {
                        year: year,
                        month: month,
                        day: day
                    },
                    result: {
                        year: dateMoment.format('YYYY'),
                        month: dateMoment.format('MM'),
                        day: dateMoment.format('DD'),
                        hour: endHour,
                        min: endMin
                    }
                });
            }
        });

        if (data.length === 0) {
            alert('残業データがありません。\n(謹之助のページが間違っている可能性もあります)');
            return;
        }

        window.localStorage.setItem(Hack.DATA_KEY, JSON.stringify(data));
        alert('残業データを読み込みました。');
    })();
};

Hack.put = function() {
    var script;
    var waitLoadScriptCount = 0;

    if (!window.jQuery) {
        script = document.createElement("script");
        script.setAttribute("src", "//code.jquery.com/jquery-1.11.3.min.js");
        document.body.appendChild(script);
    }

    (function onLoadScript() {
        if (!window.jQuery) {
            if (waitLoadScriptCount > 5) {
                alert('scriptの読み込みに失敗しました。');
                return;
            }
            setTimeout(onLoadScript, 1000);
            waitLoadScriptCount++;
            return;
        }

        var $ = window.jQuery;

        var rawData = window.localStorage.getItem(Hack.DATA_KEY);
        if (!rawData) {
            alert('読み込まれているデータがありません。');
            return;
        }

        var data = $.parseJSON(rawData);
        if (data.length === 0) {
            alert('残業データがありません。');
            return;
        }

        var executionCount = 1;
        if (data.length > 10) {
            var maxExecutionCount = Math.ceil(data.length / 10);
            var possibleExecutionCounts = [];
            var promptStr = '残業データの数が10件以上あります。\n1度に10件までしか申請できないため、範囲を指定する必要があります。\nどの範囲のデータを反映しますか？\n\n';
            for (var i = 1; i <= maxExecutionCount; i++) {
                possibleExecutionCounts.push(i);
                var rangeStart = ((i - 1) * 10) + 1;
                promptStr += i + ' : ' + rangeStart + ' ~ \n';
            }

            var promptExecutionCountResult = prompt(promptStr);
            if (promptExecutionCountResult === null) {
                return;
            }

            executionCount = +promptExecutionCountResult;
            if (possibleExecutionCounts.indexOf(executionCount) === -1) {
                alert(possibleExecutionCounts.join(', ') + 'のどれかを入力してください。');
                return;
            }
        }

        var i = 0;
        var index = (executionCount - 1) * 10;
        var limit = Math.min(executionCount * 10, data.length) - 1;

        var currentTrCount = $('#submit_form > div:eq(1) > table > tbody > tr:eq(2) > td.bgcolor_table > table tr').length;
        currentTrCount = (currentTrCount - 1) / 2;

        if (currentTrCount != (limit - index) + 1) {
            alert('入力フォームの数を増やすために、一度pageをリロードします。\nお手数ですが、もう一度"put"から同じ手順を実行してください。');
            $('input[name="reflect_data_count"]').val((limit - index));
            $('#submit_form > div:eq(1) > table > tbody > tr:eq(2) > td.bgcolor_table > table tr:last input.btn_ss').click();
            return;
        }
        // input
        $('#submit_form #lbl_disp_reflect_date').click();

        setTimeout(function() {
            for (; index <= limit; i++,index++) {
                var currentData = data[index];
                var trIndex = (i * 2);
                var $td = $('#submit_form > div:eq(1) > table > tbody > tr:eq(2) > td.bgcolor_table > table tr:eq('+trIndex+') > td:first');
                $td.find('> div:eq(0) select:eq(0)').val(currentData.target.year);
                $td.find('> div:eq(0) select:eq(1)').val(currentData.target.month);
                $td.find('> div:eq(0) select:eq(2)').val(currentData.target.day);
                $td.find('> span:eq(0) select:eq(0)').val(currentData.result.year);
                $td.find('> span:eq(0) select:eq(1)').val(currentData.result.month);
                $td.find('> span:eq(0) select:eq(2)').val(currentData.result.day);
                $td.find('> span:eq(0) select:eq(3)').val(currentData.result.hour);
                $td.find('> span:eq(0) select:eq(4)').val(currentData.result.min);
            }

            alert('データを反映しました。念のため、確認してから申請してください。');
        }, 1000);
    })();
};

// ### EXEC
// precondition
if (!window.localStorage) {
    alert('ブラウザが対応していません。バージョンアップしてからもう一度試してみてくださいã');
} else {
    var command = prompt('残業データの"読み込み"と"入力"のどちらを実行しますか？ "get"か"put"のどちらかを入力してください。\n\nget : データの読み込みをする\nput : データの入力をする');

    switch (command) {
        case 'get':
            Hack.get();
            break;
        case 'put':
            Hack.put();
            break;
        case null:
            break;
        default:
            alert('"get"か"put"のどちらかを入力してください。');
    }
}
