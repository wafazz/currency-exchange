<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'slug' => 'about',
                'title' => 'About Us',
                'icon' => 'bi-info-circle',
                'meta_description' => 'Learn more about our money exchange service.',
                'content' => <<<HTML
<h2>Who We Are</h2>
<p>We are a trusted money changer serving customers across Malaysia. Our mission is simple: give you a fair rate, fast service, and total transparency.</p>

<h2>What We Do</h2>
<ul>
  <li>Foreign currency exchange for 12+ major currencies</li>
  <li>Real-time rate display on every branch wall</li>
  <li>Digital receipts and full audit trail for every transaction</li>
</ul>

<h2>Why Customers Choose Us</h2>
<p>Our rates update every 2 seconds — you always see the true market rate. No hidden fees. No surprises at the counter.</p>
HTML,
            ],
            [
                'slug' => 'terms',
                'title' => 'Terms & Conditions',
                'icon' => 'bi-file-text',
                'meta_description' => 'Terms of service for our money exchange.',
                'content' => <<<HTML
<h2>1. Acceptance</h2>
<p>By using our services you agree to these Terms. If you do not agree, please do not use our services.</p>

<h2>2. Rates</h2>
<p>Rates shown on the website and in-branch are indicative and may change at any time. The final rate is the rate displayed at the time of your transaction.</p>

<h2>3. Identification</h2>
<p>For transactions above RM 3,000, valid government-issued ID (IC or passport) is required under AML (Anti-Money Laundering) regulations.</p>

<h2>4. Refunds</h2>
<p>Completed transactions cannot be reversed except in cases of proven error. Please check your cash and receipt before leaving the counter.</p>

<h2>5. Privacy</h2>
<p>Customer information is collected only where required by law and is never shared with third parties.</p>
HTML,
            ],
            [
                'slug' => 'contact',
                'title' => 'Contact Us',
                'icon' => 'bi-telephone',
                'meta_description' => 'Get in touch with our money exchange team.',
                'content' => <<<HTML
<h2>Visit Us</h2>
<p>
  Headquarters<br>
  Kuala Lumpur, Malaysia
</p>

<h2>Call or WhatsApp</h2>
<p>
  Phone: <a href="tel:+60300000000">+60 3-0000 0000</a><br>
  WhatsApp: <a href="https://wa.me/60120000000">+60 12-000 0000</a>
</p>

<h2>Email</h2>
<p><a href="mailto:hello@moneyexchange.test">hello@moneyexchange.test</a></p>

<h2>Operating Hours</h2>
<p>
  Monday – Friday: 9:00 AM – 7:00 PM<br>
  Saturday: 9:00 AM – 5:00 PM<br>
  Sunday &amp; Public Holidays: Closed
</p>
HTML,
            ],
        ];

        foreach ($pages as $p) {
            Page::updateOrCreate(['slug' => $p['slug']], $p);
        }
    }
}
