This repository is the note tool that is part of my proprietary LMS.

# Concept

The main concept is an HTML-based tool where students can use notes to test their understanding of class material.  I primarily use it for a Critical Thinking Class that I teach.

# Features

|code|explanation|
|----|-----|
|`<span class="fillin" hp_id="1">Orange</span>`| setting class="fillin" tells the system that the student is expected to enter that value. When the student does so, it will turn green |
|`<span class="refer" hp_id="1">&nbsp;</span>` | setting class="refer" will make it so that when the student enters the value in the `class="fillin"` entry, that this entry will also populate |
|`<span class="select" answers="Oranges,Apples,Pears" hp_id="2">Oranges</span>` | setting class="select" will make a dropdown that has the three options in `answers`. When the correct answer is selected, it will change like fillin and fill out refers |
|`<div class="note">This is a note</div>` |  This will offset text to use only part of the screen and style it as a note |
|`<span class="highlight" htype="simple">This text is important</span>`| This will highlight the text using the default "simple" highlight (partial color highlighting) |
|`<span class="highlight" htype="circle">Important word</span>`| This will put a circle around the word |
|`<span class="highlight" htype="circle" style="--hcolor:var(--color3)">weak argument</span>` | using `style="--hcolor:var(--color3)"` (or --color2 or --color1 or manually entering a color's value, the author can change the color highlighting |
|`<span class="spoiler">This text is hidden</span>` | `class="spoiler"` will make the text hidden until a user clicks on it. |
|`<span class="item" wayaku="日本語">Japanese</span>` | `class="item"` + `wayaku="???"` will add a hover hint. I use this for showing Japanese |


# Current Limitations

1. Right now, the correct answers are all directly visible in the HTML itself. Astute users can simply look at the code before it encodes them.
2. Data is only kept on the device where the student does this (it doesn't save across multiple devices.
3. This expects features from my properietary LMS to load from the database and check access.
