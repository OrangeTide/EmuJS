/* gamepad - gamepad driver for EmuJS
 *
 * Written in 2018 by Jon Mayo <jon.mayo@gmail.com>
 *
 * To the extent possible under law, the author(s) have dedicated all
 * copyright and related and neighboring rights to this software to the
 * public domain worldwide. This software is distributed without any
 * warranty.
 *
 * You should have received a copy of the CC0 Public Domain Dedication
 * along with this software.
 * If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 *
 */

var gamepads = {};

function gamepadInit()
{
  window.addEventListener("gamepadconnected", function(e) {
    var gp = e.gamepad;
    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
      gp.index, gp.id, gp.buttons.length, gp.axes.length);
    gamepads[gp.index] = gp;
  });

  window.addEventListener("gamepaddisconnected", function(e) {
    var gp = e.gamepad;
    console.log("Gamepad disconnected from index %d: %s", gp.index, gp.id);
    delete gamepads[gp.index];
  });
}
