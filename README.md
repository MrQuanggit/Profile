# Profile
Redirect Login
-index: 
<input type="hidden" name="redirectTo" value="{{ request()->get('redirectTo') }}">
- controller authenticate:
protected function redirectTo($request)
    {
        if (! $request->expectsJson()) {
            return route('login');
        }
    }
- AuthController:
if ($request->get('redirectTo')) {
                return redirect()->to($request->get('redirectTo'));
            }
- middleware custom authenticate:
public function handle(Request $request, Closure $next)
    {
        if(is_null(getAccessToken())) {
            return redirect()->route('auth.index', ['redirectTo' => $request->getRequestUri()]);
        }
        return $next($request);
    }

Fast-trade

FE: helper
<?php

use App\Facades\Api;
use App\Services\ApiService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Config;
use JetBrains\PhpStorm\ArrayShape;

if (!function_exists('getApiPath')) {
    function getApiPath($apiPath, $params = [])
    {
        if(!empty($params)) {
            foreach ($params as $key => $value) {
                $apiPath = str_replace('{'. $key .'}', $value, $apiPath);
            }
        }
        return $apiPath;
    }
}


if (!function_exists('getAccessToken')) {
    function getAccessToken()
    {
        return !empty($_COOKIE['accessToken']) ? $_COOKIE['accessToken'] : null;
    }
}

if (!function_exists('getRecordPage')) {
    function getRecordPage($screen)
    {
        $recordPage = !empty($_COOKIE['recordPage']) ? $_COOKIE['recordPage'] : '';
        if (empty($recordPage)) {
            $path = getApiPath(config('api.accounts.settings-show-record-page'));
            $response = Api::requestApi($path, [], ApiService::METHOD_GET, getAccessToken());
            $recordPage = $response['data']['data']['memo'];
            setRecordPage($recordPage);
        }

        return json_decode($recordPage, true)[$screen] ?? null;
    }
}

if (!function_exists('setRecordPage')) {
    function setRecordPage($recordPage)
    {
        setcookie('recordPage', $recordPage, time() + (config('session.lifetime') * 60), "/");
    }
}

if (!function_exists('getTimeFromTimestampFormat')) {
    function getTimeFromTimestampFormat($time, $formatReturn = 'Y-m-d H:i')
    {
        if(!empty($time))
            return Carbon::parse($time)->format($formatReturn);
        return null;
    }
}

if( (!function_exists('getErrorsFromErrorResponse'))) {
    function getErrorsFromErrorResponse($errorsResponse) {
        $errors = [];

        if(!empty($errorsResponse)) {
            foreach ($errorsResponse as $error) {
                $errors[$error['field'] ?? ''] = $error['message'] ?? '';
            }
        }
        return $errors;
    }
}

if((!function_exists('timeToJapanFormat'))) {
    function timeToJapanFormat($time, $format = 'Y年m月d日', $timeZone = 'Asia/Tokyo'): string
    {
        if ($time) {
            return Carbon::parse($time)->setTimezone(new DateTimeZone($timeZone))->format($format);
        }
        return '';
    }
}

if ((!function_exists('convertClosingDate'))) {
    function convertClosingDate($buyer)
    {
        if (!$buyer) {
            return '';
        }

        $closeDate = $buyer['closing_date'] === 0 ? '末' : $buyer['closing_date'] . '日';
        $valueClosingDate = $closeDate . '締め';

        return $valueClosingDate;
    }
}

if ((!function_exists('convertPaymentDate'))) {
    function convertPaymentDate($buyer)
    {
        if (!$buyer) {
            return '';
        }

        $paymentDate = $buyer['payment_date'] === 0 ? '末日' : $buyer['payment_date'] . '日';
        $recall = $buyer['month_of_recall'];

        switch ($recall) {
            case 0:
                $valueRecall = '当月払い';
                break;
            case 1:
                $valueRecall = '翌月払い';
                break;
            case 2:
                $valueRecall = '翌々月払い';
                break;
            case 3:
            case 4:
            case 5:
            case 6:
                $valueRecall = $recall . 'ヶ月後払い';
                break;
            default:
                $valueRecall = '当月払い';
                break;
        }

        $valueRecall .= ' '.$paymentDate;

        return $valueRecall;
    }
}

if ((!function_exists('convertRoundMethod'))) {
    function convertRoundMethod($roundMethod)
    {
        return match ($roundMethod) {
            'round' => '四捨五入',
            'floor' => '切捨て',
            default => '切上げ',
        };
    }
}

if ((!function_exists('convertDataBuyerInformation'))) {
    function convertDataBuyerInformation($buyer)
    {
        if (count($buyer)) {
            $paymentMethod = $buyer['payment_method'] === 'POSTPAID' ? '後払い' : '前払い';
            if ($buyer['payment_method'] === 'POSTPAID') {
                $closingDate = convertClosingDate($buyer);
                $paymentDate = convertPaymentDate($buyer);
            } else {
                $closingDate = '';
                $paymentDate = '';
            }

            $roundMethod = '';
            if ($buyer['round_method']) {
                switch ($buyer['round_method']) {
                    case 'round':
                        $roundMethod = '四捨五入';
                        break;
                    case 'floor':
                        $roundMethod = '切捨て';
                        break;
                    case 'ceil':
                    default:
                        $roundMethod = '切上げ';
                        break;
                }
            }

            $bankCharge = $buyer['bank_charge'] === 'OUR' ? '当方負担' : '先方負担';

            $dataBuyerInfomation = [
                'payment_method' => $paymentMethod,
                'closing_date' => $closingDate,
                'payment_date' => $paymentDate,
                'round_method' => $roundMethod,
                'bank_charge' => $bankCharge,
            ];

            return $dataBuyerInfomation;
        } else {
            return [];
        }
    }
}

if ((!function_exists('getTagsSuggestion'))) {
    #[ArrayShape(['html_tags' => "string", 'tags' => "array|mixed"])] function getTagsSuggestion($type): array
    {
        $tagSuggestionsPath = getApiPath(config('api.tags.suggestions'));
        $paramsSuggestion = [
            'filter[type]' => $type
        ];
        $getTagsSuggestion = Api::requestApi($tagSuggestionsPath, $paramsSuggestion, ApiService::METHOD_GET, getAccessToken());

        $listTags = $getTagsSuggestion['data']['data'] ?? [];
        $htmlListTags = view('components.modals.list-tags', ['tags' => $listTags])->render();

        return ['html_tags' => $htmlListTags, 'tags' => $listTags];
    }
}

if ((!function_exists('getListTags'))) {
    #[ArrayShape(['html_tags' => "string", 'tags' => "array|mixed"])] function getListTags($type): array
    {
        $tagPath = getApiPath(config('api.tags.tags'));
        $paramsSuggestion = [
            'filter[type]' => $type
        ];
        $getTags = Api::requestApi($tagPath, $paramsSuggestion, ApiService::METHOD_GET, getAccessToken());

        $listTags = $getTags['data']['data'] ?? [];
        $htmlListTags = view('components.modals.list-tags', ['tags' => $listTags])->render();

        return ['html_tags' => $htmlListTags, 'tags' => $listTags];
    }
}

if ((!function_exists('limitLength'))) {
    function limitLength($string, $limit = 30) {
        return strlen($string) > $limit ? \Illuminate\Support\Str::limit($string, $limit) : $string;
    }
}

if (! function_exists('get_csv_input_encoding')) {
    function get_csv_input_encoding($path)
    {
        $fileContent = file_get_contents($path);

        return mb_detect_encoding($fileContent, mb_list_encodings(), true);
    }
}

if (! function_exists('set_csv_input_encoding')) {
    function set_csv_input_encoding($fileContent)
    {
        $csvInputEncoding = get_csv_input_encoding($fileContent);

        Config::set('excel.imports.csv.input_encoding', $csvInputEncoding);
    }
}

if (! function_exists('getPersonInChargeReceivedOrder')) {
    function getPersonInChargeReceivedOrder($receivedOrder, $isCreatedBySeller)
    {
        return !$isCreatedBySeller
            ? $receivedOrder['user']['name']
            : (!empty($receivedOrder['person_in_charge_for_sellers']) ? $receivedOrder['person_in_charge_for_sellers'] : null);
    }
}

if (! function_exists('getPersonInChargeOrder')) {
    function getPersonInChargeOrder($order, $isCreatedBySeller)
    {
        return $isCreatedBySeller ? $order['user']['name'] : $order['person_in_charge_for_buyers'];
    }
}

if (! function_exists('checkIsCreateBySeller')) {
    function checkIsCreateBySeller($receiveOrder)
    {
        return $receiveOrder['user']['account_id'] == $receiveOrder['seller']['id'];
    }
}

if (! function_exists('formatPriceRange')) {
    function formatPriceRange($priceRanges = null)
    {
        $string = '';
        if($priceRanges != null) {
            foreach ($priceRanges as $key => $priceRange) {
                $price = number_format($priceRange['price']);
                $string .= "{$priceRange['min']}〜{$priceRange['max']}:単価:{$price}円" . '<br>';
            }
        }

        return $string;
    }
}

if (! function_exists('currentSettingAccount')) {
    function currentSettingAccount()
    {
        $settings = Session::get('settings-account');
        $currentSettings = [];

        if(empty($settings)) {
            $settingsPath = getApiPath(config('api.accounts.settings-invite-show'));
            $resAccountSettings = Api::requestApi($settingsPath, [], ApiService::METHOD_GET, getAccessToken());

            if($resAccountSettings['data']){
                $settings = (array) json_decode($resAccountSettings['data']['data']['memo']);
                pushCurrentSettingAccount($settings);
            }
        }

        if ($settings) {
            foreach ($settings as $item => $val) {
                if ($val == 1) {
                    array_push($currentSettings, $item);
                }
            }
        }
        return $currentSettings;
    }
}

if (! function_exists('pushCurrentSettingAccount')) {
    function pushCurrentSettingAccount($settings)
    {
        session()->put('settings-account', $settings);
    }
}

if (! function_exists('isSettingStorage')) {
    function isSettingStorage(): bool
    {
        $settings = Session::get('settings-account');
        if ($settings && isset($settings['is_storage'])) {
            return (bool) $settings['is_storage'];
        }
        return false;
    }
}

if (! function_exists('isShowTheChangeStatusConfirmationModal')) {
    /**
     * @throws \Psr\Container\ContainerExceptionInterface
     * @throws \Psr\Container\NotFoundExceptionInterface
     */
    function isShowTheChangeStatusConfirmationModal($key)
    {
        if (!isSettingStorage()) return false;

        $settings = session()->get('settings');
        if ($settings && isset($settings['RECEIVED_ORDER'])) {
            $memo = json_decode($settings['RECEIVED_ORDER']['memo']);
            if (property_exists($memo, $key)) {
                return (bool) $memo->{$key};
            }
        }
        return true;
    }
}

BE helper:
<?php

use Modules\Account\src\Models\Account;
use Modules\User\src\Models\User;

if (! function_exists('current_user')) {

    /**
     * @return \Modules\User\src\Models\User
     */
    function current_user(): ?User
    {
        return Auth::user();
    }

    /**
     * @return \Modules\Account\src\Models\Account
     */
    function current_account(): ?Account
    {
        if (Auth::user() && Auth::user()->account_id != Auth::user()->account->id) {
            Auth::user()->refresh();
        }

        return Auth::user() ? Auth::user()->account : null;
    }
}

if (! function_exists('is_turn_on_storage_setting')) {
    function is_turn_on_storage_setting($account = null): bool
    {
        if (is_null($account)) {
            $account = current_account();
        }

        $setting = $account->accountSetting;
        if (!$setting) {
            return false;
        }
        $setting = json_decode($setting->memo);
        return (bool) $setting->is_storage ?? false;
    }
}

if (! function_exists('random_password')) {
    /**
     * @param int $length
     * @return string
     */
    function random_password(int $length = 8): string
    {
        $password = chr(rand(65, 90)) . chr(rand(97, 122)) . rand(0, 9) . Str::random($length - 3);

        return str_shuffle($password);
    }
}

if (! function_exists('pad_emojis')) {
    function pad_emojis($string)
    {
        $defaultEncoding = mb_regex_encoding();
        mb_regex_encoding("UTF-8");
        $string = mb_ereg_replace('([^\p{L}\s])', ' \\1 ', $string);
        mb_regex_encoding($defaultEncoding);
        return $string;
    }
}
if (! function_exists('set_csv_input_encoding')) {
    function set_csv_input_encoding($fileContent)
    {
        $enc = mb_detect_encoding($fileContent, mb_list_encodings(), true);

        if ($enc == 'SJIS') {
            Config::set('excel.imports.csv.input_encoding', 'SJIS-win');
        } else {
            Config::set('excel.imports.csv.input_encoding', 'UTF-8');
        }
    }
}

if (! function_exists('get_csv_input_encoding')) {
    function get_csv_input_encoding($path)
    {
        $fileContent = file_get_contents($path);

        return mb_detect_encoding($fileContent, mb_list_encodings(), true);
    }
}

if ((!function_exists('limitLength'))) {
    function limitLength($string, $limit = 30)
    {
        return strlen($string) > $limit ? \Illuminate\Support\Str::limit($string, $limit) : $string;
    }
}

if ((!function_exists('currentDate'))) {
    function currentDate()
    {
        return \Carbon\Carbon::now()->format('Y-m-d');
    }
}

if ((!function_exists('handlePostCode'))) {
    function handlePostCode($postCode)
    {
        return $postCode ? '〒' . substr_replace($postCode, '-', 3, 0) . '　' : null;
    }
}

if ((!function_exists('limitSubStrLength'))) {
    function limitSubStrLength($string, $limit = 30, $limitLine = 20)
    {
        $string = \Illuminate\Support\Str::limit($string, $limit);
        $result = '';
        $count = 0;

        for ($i = 0; $i < mb_strlen($string, 'UTF-8'); $i++) {
            $subString = mb_substr($string, $i, 1, 'UTF-8');
            $result .= $subString;

            if (strlen($subString) == 3) {
                $count += 2;
            } else {
                $count += 1;
            }

            if ($count == ($limitLine - 1) || $count == $limitLine) {
                $result .= ' ';
                $count = 0;
            }
        }

        return $result;
    }
}

if ((!function_exists('limitSubStrLengthNoSpace'))) {
    function limitSubStrLengthNoSpace($string, $limit = 30, $limitLine = 20)
    {
        $string = \Illuminate\Support\Str::limit($string, $limit);
        $result = '';
        $count = 0;

        for ($i = 0; $i < mb_strlen($string, 'UTF-8'); $i++) {
            $subString = mb_substr($string, $i, 1, 'UTF-8');
            $result .= $subString;

            if (strlen($subString) == 3) {
                $count += 2;
            } else {
                $count += 1;
            }

            if ($count == ($limitLine - 1) || $count == $limitLine) {
                $result .= '';
                $count = 0;
            }
        }

        return $result;
    }
}

if ((!function_exists('roundMethodForTaxPrice'))) {
    function roundMethodForTaxPrice($taxPrice, $method)
    {
        switch ($method) {
            case 'ceil':
                $taxPrice = ceil($taxPrice);
                break;
            case 'floor':
                $taxPrice = floor($taxPrice);
                break;
            default:
                $taxPrice = round($taxPrice);
                break;
        }
        return $taxPrice;
    }
}

if ((!function_exists('convertStringToFullWidth'))) {
    function convertStringToFullWidth($string)
    {
        return mb_convert_kana($string, 'KHCV');
    }
}

if ((!function_exists('convertStringToHalfWidth'))) {
    function convertStringToHalfWidth($string)
    {
        return mb_convert_kana($string, 'khcv');
    }
}

if (!function_exists('makePhoneNumberWithHyphen')) {
    function makePhoneNumberWithHyphen($phone): string
    {
//        return preg_replace("/^(\d{3})(\d{3,4})(\d{4})$/", "$1-$2-$3", $phone);
        return $phone;
    }
}

if (!function_exists('generateRandomFileName')) {
    function generateRandomFileName($file = null)
    {
        if ($file) {
            return date('YmdHis') . uniqid() . '.' . $file->getClientOriginalExtension();
        }
        return date('YmdHis') . uniqid();
    }
}

if (!function_exists('existLineBreak')) {
    function existLineBreak($string)
    {
        return strstr($string, PHP_EOL);
    }
}

if ((!function_exists('replaceBreakLine'))) {
    function replaceBreakLine($string)
    {
        $string = preg_replace ('/<[^>]*>/', ' ', $string);
        // ----- remove control characters -----
        $string = str_replace("\r", ' ', $string);
        $string = str_replace("\n", ' ', $string);
        $string = str_replace("\t", ' ', $string);
        // ----- remove multiple spaces -----
        return $string;

    }
}

custom JS:
/**
 * Ajax function
 * @param $ajaxParams
 */
window.ajaxFunction = function ajaxFunction(ajaxParams, useCommon = true)
{
    let url = ajaxParams['url'];
    let showLoading = ajaxParams['showLoading'] == undefined || ajaxParams['showLoading'] == true;
    let requestType = ajaxParams['requestType'];
    let contentType = (ajaxParams['contentType'] !== undefined) ? ajaxParams['contentType'] : 'application/x-www-form-urlencoded; charset=UTF-8';
    let dataType = ajaxParams['dataType'] ? ajaxParams['dataType'] : '';
    let processData = (ajaxParams['processData'] !== undefined) ? ajaxParams['processData'] : true;
    let data = ajaxParams['data'];
    let xhrFields = ajaxParams['xhrFields'] ? ajaxParams['xhrFields'] : {} ;
    let beforeSendCallbackFunction = ajaxParams['beforeSendCallbackFunction'];
    let successCallbackFunction = ajaxParams['successCallbackFunction'];
    let completeCallbackFunction = ajaxParams['completeCallbackFunction'];
    let errorCallBackFunction = ajaxParams['errorCallBackFunction'];
    let async = (ajaxParams['async'] !== undefined) ? ajaxParams['async'] : true;

    $.ajax({
        url: url,
        type: requestType,
        processData: processData,
        contentType: contentType,
        dataType: dataType,
        data: data,
        async: async,
        xhrFields: xhrFields,
        beforeSend: function(jqXHR, settings) {
            if (showLoading) {
                handleOverlayLoading()
            }

            if (typeof beforeSendCallbackFunction === "function") {
                beforeSendCallbackFunction(jqXHR);
            }
        },
        success: function(data, textStatus, jqXHR) {
            if (typeof successCallbackFunction === "function") {
                successCallbackFunction(data);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (typeof errorCallBackFunction === "function") {
                errorCallBackFunction(jqXHR);
            }

            //common error
            if(useCommon) {
                let responseJSON = jqXHR.responseJSON;

                if(jqXHR.status !== 422 || jqXHR.status === 419) {
                    window.location.href = '/' + jqXHR.status;
                } else {
                    let body = responseJSON.data.body;
                    if(body.status_code == 422) {
                        let errors = body.errors;

                        $.each(errors, function (ind, item) {
                            let errorContent = `<label id="${ item.field }" class="error" for="${ item.field }">${item.message}</label>`
                            $('.error-' + item.field).html(errorContent);
                        });
                    } else {
                       window.location.href = '/' + body.status_code;
                    }
                }
            }
        },
        complete: function(jqXHR, textStatus) {
            handleOverlayLoadingComplete()
            if (typeof completeCallbackFunction === "function") {
                completeCallbackFunction();
            }
        }
    });
}
