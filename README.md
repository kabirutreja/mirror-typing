# Mirror Typing

A fast, juicy typing arcade game that runs in your browser. Type the falling words before they hit the floor, and watch out when the screen flips into mirror mode.

## Description

Mirror Typing started as a simple falling-words typing game with one twist: every few seconds the game switches into a pink **mirror phase**, where the words appear reversed and are worth more points. I then spent a lot of time making it feel good to play, because a typing game lives or dies on feedback.

Every correct letter gives a little spark and a blip. Every killed word explodes into particles, floats up a score, and plays a note that climbs a scale as your combo grows. Missing a word shakes the screen, flashes it red, and costs you a life. Build a long streak and the **Fever** meter fills up for eight seconds of double points and rainbow words. A small piece of music (generated in code, no audio files) speeds up with your combo and gets darker in mirror mode.

Some falling words are special:

* **Gold** words give bonus points and one extra life.
* **Ice** words freeze everything for four seconds.
* **Bomb** words wipe the whole screen and pay out for every word cleared.
* **Shield** words let you absorb one miss without losing a life.

The game gets harder as you level up (a level every 12 words), but it is meant to be forgiving. Wrong keys are ignored instead of ruining your word, words turn red as they near the floor, and there are three difficulty settings (Chill, Normal and Hard). At the end of a run you get a rank from S to C, along with your WPM and accuracy. Your best score is saved in your browser.

It is built with plain HTML, CSS and JavaScript on a single `<canvas>`, with no frameworks and no build step.

### Screenshots

<img width="1365" height="635" alt="Screenshot 2026-11-02 043837" src="https://github.com/user-attachments/assets/fc25ed3b-280d-49dd-b73a-8e15a0af60dc" />
<img width="<img width="1366" height="629" alt="Screenshot 2026-11-02 043757" src="https://github.com/user-attachments/assets/36f25778-c8c5-4f42-8209-347076f84e20" />
<img width="1366" height="633" alt="Screenshot 2026-11-02 043810" src="https://github.com/user-attachments/assets/53ed93da-70ec-497d-907c-0837dab745ee" />
<img width="745" height="433" alt="Screenshot 2026-11-02 121255" src="https://github.com/user-attachments/assets/641e8bbe-7c2a-4617-9c1a-095424f2c671" />



## Getting Started

### Dependencies

* A modern desktop web browser (Chrome, Edge, Firefox or Safari)
* A keyboard
* Nothing else. There is nothing to install and no internet connection is needed.

### Installing

* Download or clone the project folder.
* Make sure these three files sit together in the same folder (they are already set up that way):
  * `index.html`
  * `style.css`
  * `script.js`
* No changes to any files are needed.

### Executing program

* Double-click `index.html` to open it in your browser or go to the followinf github page link .
* Press `1`, `2` or `3` to pick Chill, Normal or Hard (or press `Enter` to start on the highlighted one).
* Type the falling words. A word disappears as soon as you finish typing it. No need to press Enter.
* Controls during the game:
  * `A-Z`: type
  * `Backspace`: delete a letter
  * `Esc`: clear what you have typed
  * `Enter`: pause or resume
  * `Tab`: turn all sound on or off
* When the game is over, press `Enter` to retry or `Esc` to go back to the menu.


## Help

**There is no sound.**
Browsers only start audio after you press a key, so press any key first. Also check that sound is not muted. The HUD shows `[TAB] sound: ON` or `OFF`, and Tab switches it.

**The game paused by itself.**
It pauses when the window loses focus, on purpose, so you do not lose lives when you switch tabs. Click the window and press `Enter` to carry on.

**Nothing happens or the screen is blank.**
Press `F12`, open the Console tab, and look for a red error. The most common cause is that `index.html`, `style.css` and `script.js` are not in the same folder.

**My best score disappeared.**
High scores is saved in your browser's local storage. Clearing site data or using a private window will reset them.

## License

This project is licensed under the MIT License - Kabir Utreja
