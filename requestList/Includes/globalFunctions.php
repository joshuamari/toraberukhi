<?php
function stringify($string)
{
    $stringRet = $string;
    if (strpos($string, "'")) {
        $stringRet = str_replace("'", "&apos;", $string);
    } else if (strpos($string, '"')) {
        $stringRet = str_replace("'", "&quot;", $string);
    }
    return $stringRet;
}
