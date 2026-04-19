<?php
// Generates PWA icons into public/icons.
// Usage:  php scripts/generate-icons.php

$outDir = __DIR__ . '/../public/icons';
if (! is_dir($outDir)) mkdir($outDir, 0755, true);

function drawIcon(int $size, bool $maskable, string $path): void
{
    $img = imagecreatetruecolor($size, $size);
    imagesavealpha($img, true);

    $bgTop = [0x0d, 0x6e, 0xfd];     // Bootstrap primary
    $bgBot = [0x08, 0x4a, 0xbd];     // deeper blue

    // Vertical gradient background
    for ($y = 0; $y < $size; $y++) {
        $t = $y / ($size - 1);
        $r = (int) ($bgTop[0] * (1 - $t) + $bgBot[0] * $t);
        $g = (int) ($bgTop[1] * (1 - $t) + $bgBot[1] * $t);
        $b = (int) ($bgTop[2] * (1 - $t) + $bgBot[2] * $t);
        $col = imagecolorallocate($img, $r, $g, $b);
        imageline($img, 0, $y, $size - 1, $y, $col);
    }

    $white = imagecolorallocate($img, 255, 255, 255);
    $shadow = imagecolorallocatealpha($img, 0, 0, 0, 90);

    // Maskable icons need content inside the safe zone (80% center).
    $safeInset = $maskable ? (int) ($size * 0.10) : 0;
    $inner = $size - 2 * $safeInset;

    // Draw a rounded-rect card behind the glyph for a cleaner look (skip for maskable since bg is already filled).
    if (! $maskable) {
        $pad = (int) ($size * 0.18);
        $radius = (int) ($size * 0.22);
        $cardCol = imagecolorallocatealpha($img, 255, 255, 255, 120);
        imagefilledroundedrect(
            $img,
            $pad, $pad,
            $size - $pad, $size - $pad,
            $radius, $cardCol
        );
    }

    // Big centered "RM" glyph (for non-maskable) or currency symbol for maskable
    $text = '$';
    $fontFile = __DIR__ . '/../vendor/laravel/framework/src/Illuminate/Mail/resources/fonts/InstrumentSans-Regular.ttf';
    if (! is_file($fontFile)) {
        // Fallback: built-in font (smaller, but works without TTF dependency)
        $fontSize = 5;
        $fw = imagefontwidth($fontSize) * strlen($text);
        $fh = imagefontheight($fontSize);
        $scale = (int) floor($inner * 0.5 / max($fw, $fh));
        if ($scale < 1) $scale = 1;
        $tx = $safeInset + (int) (($inner - $fw * $scale) / 2);
        $ty = $safeInset + (int) (($inner - $fh * $scale) / 2);
        $tmp = imagecreatetruecolor($fw, $fh);
        imagesavealpha($tmp, true);
        $trans = imagecolorallocatealpha($tmp, 0, 0, 0, 127);
        imagefill($tmp, 0, 0, $trans);
        imagestring($tmp, $fontSize, 0, 0, $text, $white);
        imagecopyresized($img, $tmp, $tx, $ty, 0, 0, $fw * $scale, $fh * $scale, $fw, $fh);
        imagedestroy($tmp);
    } else {
        $fontSize = $inner * 0.55;
        $box = imagettfbbox($fontSize, 0, $fontFile, $text);
        $tw = $box[2] - $box[0];
        $th = $box[1] - $box[7];
        $tx = $safeInset + (int) (($inner - $tw) / 2) - $box[0];
        $ty = $safeInset + (int) (($inner + $th) / 2) - $box[1];
        imagettftext($img, $fontSize, 0, $tx + 2, $ty + 2, $shadow, $fontFile, $text);
        imagettftext($img, $fontSize, 0, $tx, $ty, $white, $fontFile, $text);
    }

    imagepng($img, $path, 9);
    imagedestroy($img);
    echo "✓ Wrote {$path}\n";
}

function imagefilledroundedrect($img, int $x1, int $y1, int $x2, int $y2, int $radius, int $color): void
{
    imagefilledrectangle($img, $x1 + $radius, $y1, $x2 - $radius, $y2, $color);
    imagefilledrectangle($img, $x1, $y1 + $radius, $x2, $y2 - $radius, $color);
    imagefilledellipse($img, $x1 + $radius, $y1 + $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($img, $x2 - $radius, $y1 + $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($img, $x1 + $radius, $y2 - $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($img, $x2 - $radius, $y2 - $radius, $radius * 2, $radius * 2, $color);
}

drawIcon(192, false, $outDir . '/icon-192.png');
drawIcon(512, false, $outDir . '/icon-512.png');
drawIcon(512, true, $outDir . '/icon-maskable-512.png');
drawIcon(180, false, $outDir . '/apple-touch-icon.png');

echo "\nAll icons generated in {$outDir}\n";
