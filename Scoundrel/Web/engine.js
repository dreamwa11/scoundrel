/* Scoundrel rules engine — pure, no DOM.
 * House rules:
 *  - 44 cards: clubs & spades 2..A are monsters (J=11 Q=12 K=13 A=14),
 *    diamonds 2..10 are weapons, hearts 2..10 are potions.
 *  - Room of 4. After 3 cards are resolved the room is refilled to 4.
 *  - Flee: only with a full room, never twice in a row. Room goes to the bottom of the deck.
 *  - One potion per room; a second potion is discarded with no effect.
 *  - A weapon can hit a monster only if it has no kills yet or the monster is <= its last kill.
 *  - When 1–2 cards remain in the deck they are pulled into the room straight away.
 *  - Score: died → HP minus remaining monster values. Survived → HP,
 *    plus the last potion's value if HP is full and the last action was drinking it.
 */
(function (root) {
  'use strict';

  var ROOM_SIZE = 4;
  var RESOLVE_PER_ROOM = 3;
  var DEFAULT_HP = 20;
  var RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  function rankValue(r) {
    if (r === 'J') return 11;
    if (r === 'Q') return 12;
    if (r === 'K') return 13;
    if (r === 'A') return 14;
    return parseInt(r, 10);
  }

  function buildDeck() {
    var deck = [], id = 0;
    ['clubs', 'spades'].forEach(function (suit) {
      RANKS.forEach(function (r) {
        deck.push({ id: id++, suit: suit, rank: r, value: rankValue(r), type: 'monster' });
      });
    });
    RANKS.slice(0, 9).forEach(function (r) {
      deck.push({ id: id++, suit: 'diamonds', rank: r, value: rankValue(r), type: 'weapon' });
    });
    RANKS.slice(0, 9).forEach(function (r) {
      deck.push({ id: id++, suit: 'hearts', rank: r, value: rankValue(r), type: 'potion' });
    });
    return deck;
  }

  function shuffle(arr, rng) {
    var a = arr.slice();
    rng = rng || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function monsterName(card) {
    if (card.rank === 'J') return 'Jack';
    if (card.rank === 'Q') return 'Queen';
    if (card.rank === 'K') return 'King';
    if (card.rank === 'A') return 'Ace';
    var v = card.value;
    if (v === 2) return 'Goblin';
    if (v <= 4) return 'Wolf';
    if (v <= 6) return 'Skeleton';
    if (v <= 8) return 'Orc';
    return 'Beast';
  }

  function weaponName(card) {
    var v = card.value;
    if (v <= 3) return 'Dagger';
    if (v <= 5) return 'Shortsword';
    if (v <= 8) return 'Longsword';
    return 'Greatsword';
  }

  function potionName(card) {
    var v = card.value;
    if (v <= 3) return 'Small potion';
    if (v <= 8) return 'Potion';
    return 'Large potion';
  }

  function cardName(card) {
    if (card.type === 'monster') return monsterName(card);
    if (card.type === 'weapon') return weaponName(card);
    return potionName(card);
  }

  function newGame(maxHp, rng) {
    maxHp = maxHp > 0 ? Math.floor(maxHp) : DEFAULT_HP;
    var deck = shuffle(buildDeck(), rng);
    return {
      deck: deck.slice(ROOM_SIZE),
      room: deck.slice(0, ROOM_SIZE),
      hp: maxHp,
      maxHp: maxHp,
      weapon: null,            // { card, last: null|number, slain: [cards] }
      resolved: 0,             // cards resolved in the current room
      potionUsed: false,       // a potion was drunk in this room
      fledLast: false,         // the current room was entered by fleeing
      started: false,          // any card has been resolved this dungeon
      roomNo: 1,
      over: false,
      won: false,
      score: null,
      lastAction: null,        // 'fight' | 'potion' | 'equip' | 'wasted' | 'flee'
      lastPotion: null,
      message: ''
    };
  }

  function clone(s) { return JSON.parse(JSON.stringify(s)); }

  function weaponCanHit(state, card) {
    var w = state.weapon;
    if (!w) return false;
    return w.last === null || card.value <= w.last;
  }

  /** Damage previews for a monster card. */
  function damagePreview(state, card) {
    var fist = card.value;
    var weapon = weaponCanHit(state, card) ? Math.max(0, card.value - state.weapon.card.value) : null;
    return { fist: fist, weapon: weapon };
  }

  function remainingMonsterSum(state) {
    return state.deck.concat(state.room)
      .filter(function (c) { return c.type === 'monster'; })
      .reduce(function (t, c) { return t + c.value; }, 0);
  }

  function refillRoom(s) {
    var need = ROOM_SIZE - s.room.length;
    if (need > 0 && s.deck.length) {
      s.room = s.room.concat(s.deck.slice(0, need));
      s.deck = s.deck.slice(need);
    }
  }

  function afterResolve(s, ev) {
    s.resolved += 1;
    if (s.resolved === RESOLVE_PER_ROOM) {
      var hadDeck = s.deck.length > 0;
      refillRoom(s);
      s.resolved = 0;
      s.potionUsed = false;
      s.fledLast = false;
      if (hadDeck) { s.roomNo += 1; ev.newRoom = true; }
    }
    // site behaviour: last 1–2 deck cards join the room immediately
    if (s.deck.length > 0 && s.deck.length < 3 && s.room.length < ROOM_SIZE) {
      refillRoom(s);
      ev.pulledLast = true;
    }
    checkEnd(s, ev);
  }

  function checkEnd(s, ev) {
    if (s.over) return;
    if (s.hp <= 0) {
      s.over = true; s.won = false;
      s.score = s.hp - remainingMonsterSum(s);
      ev.died = true;
    } else if (s.deck.length === 0 && s.room.length === 0) {
      s.over = true; s.won = true;
      var bonus = (s.hp === s.maxHp && s.lastAction === 'potion' && s.lastPotion) ? s.lastPotion : 0;
      s.score = s.hp + bonus;
      ev.won = true;
    }
  }

  /**
   * Resolve the card at room index i.
   * mode: 'auto' (weapon if it can hit, else bare hands), 'weapon', or 'fist'.
   * Returns { state, event } — state is a new object.
   */
  function resolve(state, i, mode) {
    if (state.over) return { state: state, event: null };
    var s = clone(state);
    var card = s.room[i];
    if (!card) return { state: state, event: null };
    var ev = { card: card, kind: null, damage: 0, heal: 0 };
    s.started = true;

    if (card.type === 'monster') {
      var name = monsterName(card);
      var useWeapon = (mode !== 'fist') && weaponCanHit(s, card);
      var dmg;
      if (useWeapon) {
        dmg = Math.max(0, card.value - s.weapon.card.value);
        s.weapon.last = card.value;
        s.weapon.slain.push(card);
        ev.kind = 'kill-weapon';
        s.message = 'Slew the ' + name + (dmg ? '. Took ' + dmg + ' damage.' : '. No damage taken.');
      } else {
        dmg = card.value;
        ev.kind = 'kill-fist';
        if (mode === 'weapon' && s.weapon) {
          s.message = 'Too dull for the ' + name + '. Bare hands: took ' + dmg + '.';
        } else {
          s.message = 'Fought the ' + name + ' bare-handed. Took ' + dmg + '.';
        }
      }
      s.hp -= dmg;
      ev.damage = dmg;
      s.lastAction = 'fight';
    } else if (card.type === 'weapon') {
      ev.replaced = s.weapon ? s.weapon.card : null;
      s.weapon = { card: card, last: null, slain: [] };
      s.message = 'Equipped the ' + weaponName(card).toLowerCase() + ' (' + card.value + ').';
      ev.kind = 'equip';
      s.lastAction = 'equip';
    } else {
      if (s.potionUsed) {
        s.message = 'One potion per room. This one is wasted.';
        ev.kind = 'wasted';
      } else {
        var before = s.hp;
        s.hp = Math.min(s.maxHp, s.hp + card.value);
        ev.heal = s.hp - before;
        s.potionUsed = true;
        s.lastAction = 'potion';
        s.lastPotion = card.value;
        s.message = ev.heal > 0 ? 'Drank a potion: +' + ev.heal + ' HP.' : 'Drank a potion. Already at full health.';
        ev.kind = 'potion';
      }
    }

    s.room.splice(i, 1);
    afterResolve(s, ev);
    return { state: s, event: ev };
  }

  function canFlee(state) {
    return !state.over && state.room.length === ROOM_SIZE && !state.fledLast;
  }

  function flee(state) {
    if (!canFlee(state)) {
      var s0 = clone(state);
      if (state.fledLast) s0.message = 'You cannot flee two rooms in a row!';
      return { state: s0, event: null };
    }
    var s = clone(state);
    var all = s.deck.concat(s.room);
    s.room = all.slice(0, ROOM_SIZE);
    s.deck = all.slice(ROOM_SIZE);
    s.resolved = 0;
    s.potionUsed = false;
    s.fledLast = true;
    s.roomNo += 1;
    s.lastAction = 'flee';
    s.message = 'You fled to the next room.';
    return { state: s, event: { kind: 'flee' } };
  }

  var api = {
    ROOM_SIZE: ROOM_SIZE, DEFAULT_HP: DEFAULT_HP,
    buildDeck: buildDeck, shuffle: shuffle, newGame: newGame,
    resolve: resolve, flee: flee, canFlee: canFlee,
    weaponCanHit: weaponCanHit, damagePreview: damagePreview,
    remainingMonsterSum: remainingMonsterSum,
    monsterName: monsterName, weaponName: weaponName, potionName: potionName, cardName: cardName
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Scoundrel = api;
})(typeof window !== 'undefined' ? window : this);
