## ekoparty_pre-ctf: web50

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | Hacker's Market | Web |    50 |


>*Description*
>Hacker's market site is not ready but you can send us some comments!
>http://challs.ctf.site:10000/hackersmarket/ 

----------
## Write-up

The login, home and contact pages are located at

>```
>http://challs.ctf.site:10000/hackersmarket/index.php?p=pages/login.tpl
>http://challs.ctf.site:10000/hackersmarket/index.php?p=pages/home.tpl
>http://challs.ctf.site:10000/hackersmarket/index.php?p=pages/contact.tpl
>```

After a little bit (ahum) of recon we find the pages:

>```
>http://challs.ctf.site:10000/hackersmarket/index.php?p=login.php
>http://challs.ctf.site:10000/hackersmarket/index.php?p=contact.php
>```

In the source of these pages there is some php code:

Login:

>```php
><?php
>// NULL Code Obfuscator
>// www.null-life.com
>include 'encoder.php';
>
>error_reporting(0);
>$code =
>'m2lSp9NqH/+GdlqrrV893KZUVeqfbhvj1VJbr9QpUq6XYgL7iydW0KJAIdupKALugXwF4IBrVdLbJlL0+C9Sr9IrF+KTZh6vzy9W0KJAIdupKBfik2YeqK80eK/SL1Krgm4B/NIvT6/WUCLAoVspqIJuAfyFYADr1VJJhfgvUq/SIF2vuy8R7pwvHOCGLxbmgWwe4IFqUvuaalL9l24er5lqC6+Te1L7mmYBr59gH+qce3iv0i9SoN0vVuSXdlKy0igA7pxrHeKtfxr/rWAQ6Yd8Ee6GZh3h1TR4r9IvUquZaguvzy9VqMkFUq/SLxvp0idW6p9uG+PSMk+y0igT659mHM+abhHkl30f7oBkF/vcYBzmnWFVr9QpUquCbgH80jJPstIoE+ufZhyo2y8JhdIvUq/SL1Kvl2wa4NIoTuubeVLsnm4B/M8tE+OXfQavk2MX/YYiAfqRbBf8gS1S/Z1jF7LQbh7qgHtQsc58Bv2dYRWxhWoe49JrHeGXLk6ggXsA4JxoTK+3RD301S9cr9ZkF/bSIVKojzNd65t5TKjJBVKv0i8Pr5djAerSdHiv0i9Sr9IvUuqRZx2v1TMW5oQvEeOTfAGy0G4e6oB7Uu6eagD732sT4ZVqAK3SfR3jlzJQ7p5qAPvQMU78hn0d4ZUxPefSfBzugi5OoIF7AOCcaEyvpX0d4ZUvEf2XaxfhhmYT44EzXeubeUyoyQVSr9IvD4WPLxfjgWpS9PgvUq/SZxfulmoAp9VDHeyTexvgnDVS5pxrF/fcfxr/1SZJhY8=';
>
>$base = "\x62\x61\x73\x65\x36\x34\x5f\x64\x65\x63\x6f\x64\x65";
>eval(NULLphp\getcode(basename(__FILE__), $base($code)));
>?>
>```

Contact:

>```php
><?php
>// NULL Code Obfuscator
>// www.null-life.com
>include 'encoder.php';
>
>error_reporting(0);
>$code =
>'9oQ/Sr6HchLrmzdGwLJQMcu5OAz+j3pFwss/RLnCPgfykmsbt8ZAMtCxSzm4h3ID9o44P7bCOUS/w3oP75ZmSru9Ty3MtkRF8odsEf6FekXCyzZC5Og/Qr/CegH3jT9Fo4Z2FL+BcwPskSJA/o56EOvCfg76kGtP7Jd8AfqRbEC/kHAO+t89A/OHbRa93EYN6pA/B/KDdg6/lX4Rv5FqAfyHbATqjnMbv5F6DOvOPxb3g3EJ7MMjTfuLaVy42RUfv4dzEfrCZGi/wj9C94d+BvqQN0XTjXwD64twDKXCdgz7h2dM74pvRbbZFR8=';
>
>$base = "\x62\x61\x73\x65\x36\x34\x5f\x64\x65\x63\x6f\x64\x65";
>eval(NULLphp\getcode(basename(__FILE__), $base($code)));
>?>
>```

This code references encoder.php, lets try there:

http://challs.ctf.site:10000/hackersmarket/index.php?p=encoder.php

>```php
><?php
>
>namespace NULLphp;
>
>$seed = 13;
>function rand() {
>    global $seed;
>
>    return ($seed = ($seed * 127 + 257) % 256);
>}
>
>function srand($init) {
>    global $seed;
>
>    $seed = $init;
>}
>
>function generateseed($string) {
>   $output = 0;
>
>    for ($i = 0; $i < strlen($string); $i++) {
>        $output += ord($string[$i]);
>    }
>
>    return $output;
>}
>
>function getcode($filename, $code) {
>    srand(generateseed($filename));
>
>    $result = '';
>    for ($i = 0; $i < strlen($code); $i++) {
>        $result .= chr(ord($code[$i]) ^ rand());
>    }
>
>    return $result;
>}
>```

We can save these three php snippets as context.php, encoder.php and login.php, then replace the calls to eval with print:

>```
>$ php -f login.php 
>if (!empty($_POST['email']) && !empty($_POST['password'])) {
>    $email = $_POST['email'];
>    $pass  = $_POST['password'];
>
>    // I can not disclose the real key at this moment
>    // $key = 'random_php_obfuscation';
>    $key = '';
>    if ($email === 'admin@hackermarket.onion' && $pass === 'admin') {
>        echo '<div class="alert alert-success" role="alert"><strong>well done!</strong> EKO{' . $key . '}</div>';
>    } else {
>        echo '<div class="alert alert-danger" role="alert"><strong>Oh snap!</strong> Wrong credentials</div>';
>    }
>} else {
>    header('Location: index.php');
>}
>```

We see the flag is:

>```
>EKO{random_php_obfuscation}
>```
