document.addEventListener('DOMContentLoaded', function () {
    const getVal = (id) => {
        return parseInt($(`#${id}`).val()); // Fixed template literal issue
    };
    const storeState = () => {
        // store the contents for retrieval
        const t = $('input');
        let inputValues = {};
        let resContents = {};
        t.each((i, r) => {
            const R = $(r);
            inputValues[i] = R.val(); // Store input values
        });
        $('.res').each((i, r) => {
            const R = $(r);
            resContents[i] = R.html(); // Store .res contents
        });
        localStorage.setItem('inputValues', JSON.stringify(inputValues));
        localStorage.setItem('resContents', JSON.stringify(resContents));
    };
//    const gameID = 'vik6'; /* hard coded in dev */
//    const socket = io('', {
//        query: {
//            role: 'scoretest',
//            id: gameID
//        }
//    });
    let gameID = null;
    let socket = null;
    const teams = [
        {
            id: 0,
            title: 'gov'
        },
        {
            id: 1,
            title: 'ICM'
        },
        {
            id: 2,
            title: 'WEB'
        },
        {
            id: 3,
            title: 'CSO'
        },
        {
            id: 4,
            title: 'SME'
        },
    ];
    let game = null;
    let scores = [];
    let scoresTemp = [];
    let scorePackets = [];
    let mode = 0;
    const modes = ['single', 'full'];
    const createScore = (r, s, d, v, c) => {
        return `${r}_${s}_${d}_${v}_${c}`;
    };
    const checkScores = () => {
        scores.forEach(s => {
            if (scores.filter(i => s === i).length > 1) {
                console.log(`duplicate score: ${s}`);
            }
        });
    };
    const getRoundScores = (r, a) => {
//        const A = a || scores;
        const A = a || scorePackets;
        let sc = [];
        if (typeof(A[0]) === 'string') {
            sc = A.filter(s => parseInt(s.split('_')[0]) === parseInt(r));
        } else {
            sc = A.filter(s => s.round === parseInt(r));
        }
        return sc;
    };
    const getSrcScores = (r, a) => {
//        const A = a || scores;
        const A = a || scorePackets;
        let sc = [];
        if (typeof(A[0]) === 'string') {
            sc = A.filter(s => parseInt(s.split('_')[1]) === parseInt(r));
        } else {
            sc = A.filter(s => s.src === parseInt(r));
        }
        return sc;
    };
    const getDestScores = (r, a) => {
//        const A = a || scores;
        const A = a || scorePackets;
        let sc = [];
        if (typeof(A[0]) === 'string') {
            sc = A.filter(s => parseInt(s.split('_')[2]) === parseInt(r));
        } else {
            sc = A.filter(s => s.dest === parseInt(r));
        }
        return sc;
    };
    const getTotalVals = (a) => {
        let t = 0;
        a.forEach(s => {
            const v = typeof(s) === 'string' ? parseInt(s.split('_')[3]) : s.val;
            t += isNaN(v) ? 0: v;
        });
        return t;
    };
    const getScoreValue = (s) => {
        const r = s === undefined ? 0 : (typeof(s) === 'string' ? parseInt(s.split('_')[3]) : s.val);
        return r;
    };
    const generateScoreSubmission = (idOb) => {
        const jn = window.justNumber;
        const o = {
            round: jn(idOb[1]),
            src: jn(idOb[2]),
            dest: jn(idOb[3]),
            val: 99,
            client: jn(idOb[2])
        }
        return o;
//        console.log(idOb);
//        console.log(o);
    };
    const calc = () => {
        buildScores();
        scorePackets = createScorePackets();
        updateScoreboard();
        storeState();
    };
    const processData = () => {
        // creates a scores object for display
//        console.log('~~~~~~~~~~~~~~~~~ PROCESS DATA ~~~~~~~~~~~~~~~~~~~~');
//        console.log(scores)
        const out = {};
        const T = 5;
        const gtv = getTotalVals;
        const gds = getDestScores;
        const gss = getSrcScores;
        const grs = getRoundScores;
        const gsv = getScoreValue;
        let shArray = new Array();
        let shTotal = new Array(5).fill(0);
        let c = 0;
        for (let i = 0; i < T; i++) {
//            const a1 = gsv(grs(1)[i]);
//            const a1 = gsv(gds(i, grs(1))[0]);
            const a1 = gds(i, grs(1))[0];
            const a2 = gds(i, grs(3))[0];
//            const a2 = gsv(grs(3)[i]);
            const t = gtv(gds(i, grs(4)));
            const at = gtv(gds(i, grs(3))) + gtv(gds(i, grs(4))); /* formula N */
            //const pv1_1 = gss(5, grs(2))[i]; /* first PV1 score  */
            //const pv1_2 = gss(6, grs(2))[i]; /* first PV2 score  */
            const pv1_1 = gds(i, gss(5, grs(2)))[0]; /* first PV1 score  */
            const pv1_2 = gds(i, gss(6, grs(2)))[0]; /* first PV2 score  */
//            console.log(`pv1_1: ${pv1_1}`, pv1_1, gsv(gds(i, gss(6, grs(2)))[0]));
//            console.log(`pv1_2: ${pv1_2}`, pv1_2);
            const pvt1 = gtv(gds(i, grs(2))); /* first PV total */
            const apv1 = gsv(a1) * pvt1;
            const collArray = gds(i, grs(4));
            const collScores = [];
            const pv2_1 = gds(i, gss(5, grs(5)))[0]; /* second PV1 score  */
            const pv2_2 = gds(i, gss(6, grs(5)))[0]; /* second PV2 score  */
            const pvt2 = gtv(gds(i, grs(5))); /* second PV total */
            const acpvf = (gtv(gds(i, grs(3))) + gtv(gds(i, grs(4)))) * gtv(gds(i, grs(5))); /* formula P */
//            console.log('share loop');
            for (let j = 0; j < T; j++) {
                const coll = gds(i, grs(4));
                const coll2 = gds(i, collArray);
                const collScoreArr = gss(j, coll2);
                const collScore = collScoreArr.length ? collScoreArr[0] : '-';
                collScores.push(collScore);
                const sc = gsv(gss(j, coll)[0]);
                const f = (sc / at) * acpvf;
//                console.log(`${i}, ${j}, ${sc} / ${at} = ${(sc / at)}, acpvf: ${acpvf}, result: ${f}`);
                shArray.push({sh: i === j ? 0 : f});
                if (!isNaN(f)) {
                    shTotal[i] += f;
                }
            };
            out[`r${i}`] = {
                t: teams[i].title,
                a1: a1,
                collTotal: t,
                collScores: collScores,
                allCollTotal: at,
                pv1_1: pv1_1,
                pv1_2: pv1_2,
                pvt1: pvt1,
                total2030: apv1,
                a2: a2,
                pv2_1: pv2_1,
                pv2_2: pv2_2,
                pvt2: pvt2,
                allCollPV: acpvf,
                shTotal: shTotal,
                shArray: []
            };
//            console.log(out[`r${i}`]);
        }
//        console.log(shArray);
        Object.values(out).forEach((r, i) => {
//            console.log('share loop', i);
            for (let j = 0; j < T; j++) {
                const n = shArray[(j * T) + i].sh;
                r.shArray.push(n);
//                console.log(((j * T) + i), r.shArray);
            }
            r.shTotal = r.shArray.reduce((total, num) => total + (isNaN(num) ? 0 : num), 0);
                r.scorePlusShare = r.shTotal + r.allCollPV;
                r.grandTotal = r.scorePlusShare + r.total2030;
            });
        Object.values(out).forEach((r, i) => {
            if (i === 0) {
                Object.entries(r).forEach((e, j) => {
//                    console.log('-', e[0], e[1]);
                });
            }
        });
//        console.log(out);
        return out;
    };
//    window.getScoresSummary = processData;
    const renderFormSummary = (o) => {
        const S = $('#formSummary');
        const T = game.persistentData.teamsArray;
//        console.log(S);
        let s = '<table class="formSummary">';
        s += `<tr><td>round:</td><td>${o.round}</td></tr>`;
        s += `<tr><td>source:</td><td>${T[o.src].title} (${T[o.src].id})</td></tr>`;
        s += `<tr><td>dest:</td><td>${T[o.dest].title} (${T[o.dest].id})</td></tr>`;
        s += '</table>';
        S.html(s);
//        console.log(game);
    };
    const openForm = (o) => {
        const F = $('#changeFormWrapper');
        F.addClass('active');
        F.off('click').on('click', function () {
            $(this).removeClass('active');
            $('.input').removeClass('selected');
        });
        // Prevent closing when clicking inside the form
        $('#changeForm').off('click').on('click', function (e) {
            e.stopPropagation();
        });
        F.find('#changeMsg').html(o.msg);
        F.find('input').val(o.val);
        F.find('button').data('scoreData', o);
        renderFormSummary(o.scoreSub);
        F.find('button').off('click').on('click', function () {
            const sd = $(this).data('scoreData');
            const sp = sd.sp;
            const score = o.scoreSub;
            score.val = window.justNumber(F.find('input').val());
            const sc = createScore(score.round, score.src, score.dest, score.val, score.client);
            console.log(sc);
            console.log(score);
//            return
            socket.emit('forceScore', {scoreCode: sc, scorePacket: score, game: game.uniqueID}, (o) => {
                game.scores = o;
                updateScores(game);
                F.removeClass('active');
                setTimeout(() => {
                    $('.input.selected').removeClass('selected');
                }, 1500);F
            });
        });
    };
    const makeClickables = (boo) => {
//        console.log(`makeClickables`, boo);
        $('.input').off('click');
        $('#all').html(boo ? 'Full Edit Mode' : 'Single Score Edit Mode')
        if (boo) {
            $('#send').hide();
            $('#reset').hide();
            $('.input').addClass('clickable');
            $('.input').on('click', function () {
                let msg = '';
                const r = window.justNumber($(this).closest('.inputs').attr('id'));
                const id = $(this).attr('id');
                const idOb = id.split('_');
                const roundClicked = idOb[1];
                const sp = typeof($(this).data('scorePacket')) === 'object' ? $(this).data('scorePacket') : null;
                $('.input').removeClass('selected');
                $(this).addClass('selected');
                let safeScore = false;
                if (sp) {
                    msg = `A user has set a score for this round.`;
                } else {
                    if (roundClicked > game.round) {
                        msg = `This round has not yet been started.`
                    } else {
                        msg = ` it is probably OK to set this score.`;
                        safeScore = true;
                    }
                }
                if (!safeScore) {
                    msg += ' You can still set a score but this is a risky operation and may cause problems to occur.'
                }
                openForm({safeScore: safeScore, msg: msg, val: $(this).html() || 0, sp: sp, idOb: idOb, scoreSub: generateScoreSubmission(idOb)});
                generateScoreSubmission(idOb);
            });
        } else {
            $('#send').show();
            $('#reset').show();
        }
    };
    const updateField = (f, v) => {
        const fType = f.is('input') ? 'input' : 'td';
        if (fType === 'td') {
            f.html(v);
        } else {
            f.val(v);
        }
        f.data('scorePacket', v);
    };
    const getFieldsObject = () => {
        const R = $('.inputs');
        const O = {};
        R.each((i, ri) => {
            const o = {};
            const r = $(ri);
            o.a1 = $(r.find('.a1'));
            o.pv1_1 = $(r.find('.pv_1_1'));
            o.pv1_2 = $(r.find('.pv_1_2'));
            o.pvt1 = $(r.find('.pvt1'));
            o.total2030 = $(r.find('.2030total'));
            o.a2 = $(r.find('.a2'));
            o.c = r.find('.c');
            o.totalColl = $(r.find('.ctotal'));
            o.allCollTotal = $(r.find('.allCollTotal'));
            o.pv2_1 = $(r.find('.pv_2_1'));
            o.pv2_2 = $(r.find('.pv_2_2'));
            o.pvt2 = $(r.find('.pvt2'));
            o.allCollPV = $(r.find('.allCollPV'));
            o.shTotal = $(r.find('.shTotal'));
            o.scoreShare = $(r.find('.scoreShare'));
            o.total2040 = $(r.find('.2040total'));
            o.sh = r.find('.sval');
            O[`r${i}`] = o;
        });
        return O;
    };
    const updateScoreboardFields = () => {
        const T = processData();
        const B = getFieldsObject();
        for (let i in B) {
            for (let j in B[i]) {
//                console.log(B[i][j].children());
                if (B[i][j].children().length > 0 && !B[i][j].hasClass('res')) {
                    B[i][j] = B[i][j].find('input');
//                    console.log('switch to input');
                }
            }
        }
        Object.values(B).forEach((R, i) => {
            const t = Object.values(T)[i];
            updateField(R.a1, getScoreValue(t.a1));
            updateField(R.pv1_1, getScoreValue(t.pv1_1));
            updateField(R.pv1_2, getScoreValue(t.pv1_2));
            updateField(R.pvt1, t.pvt1);
            updateField(R.total2030, t.total2030);
            R.c.each((j, c) => {
                updateField($(c), (i === j ? '' : getScoreValue(t.collScores[j])));
                $(c).removeClass('blank');
                if (i === j) {

                    if ($(c).attr('id')) {
//                        console.log(`blanking ${$(c).attr('id')}`)
                        $(c).addClass('blank');
                        $(c).removeClass('input');
                    }
                }
            });
            //2040
            updateField(R.a2, getScoreValue(t.a2));
            updateField(R.totalColl, t.collTotal);
            updateField(R.allCollTotal, t.allCollTotal);
            updateField(R.pv2_1, getScoreValue(t.pv2_1));
            updateField(R.pv2_2, getScoreValue(t.pv2_2));
            updateField(R.pvt2, t.pvt2);
            updateField(R.allCollPV, t.allCollPV);
            R.sh.each((j, s) => {
                updateField($(s), (i === j ? '' : t.shArray[j]));
                $(s).removeClass('blank');
                if (i === j) {
                    $(s).addClass('blank');
                }
            });
            updateField(R.shTotal, t.shTotal);
            updateField(R.scoreShare, t.scorePlusShare);
            updateField(R.total2040, t.grandTotal);
        });
        makeClickables(mode === 0);
    };
    const updateScoreboard = () => {
//        console.log('UPDATE');
        updateScoreboardFields();
    };
    const buildScores = () => {
        // grabs the values from the inputs and creates an array
        let scs = [];
        const R = $('.inputs');
        // round 1 Allocation 1
        let r = 1;
        const A1 = $('.a1');
        A1.each((i, e) => {
            scs.push(createScore(r, i, i, parseInt($(e).val()), i));
        });
        // round 2 PV 1
        r = 2;
        const pv_1_1 = $('.pv_1_1');
        const pv_1_2 = $('.pv_1_2');
        pv_1_1.each((i, e) => {
            scs.push(createScore(r, 5, i, parseInt($(e).val()), 5));
        });
        pv_1_2.each((i, e) => {
            scs.push(createScore(r, 6, i, parseInt($(e).val()), 6));
        });
        // round 3 Allocation 2
        r = 3;
        const A2 = $('.a2');
        A2.each((i, e) => {
            scs.push(createScore(r, i, i, parseInt($(e).val()), i));
        });
        // round 4 Collaboration
        r = 4;
        R.each((i, e) => {
            const C = $(e).find('.ci');
            C.each((j, c) => {
//                if (i !== j) {
                    scs.push(createScore(r, j, i, i === j ? 'x' : parseInt($(c).val()), j));
//                }
            });
        });
        // round 5 PV 2
        r = 5;
        const pv_2_1 = $('.pv_2_1');
        const pv_2_2 = $('.pv_2_2');
        pv_2_1.each((i, e) => {
            scs.push(createScore(r, 5, i, parseInt($(e).val()), 5));
        });
        pv_2_2.each((i, e) => {
            scs.push(createScore(r, 6, i, parseInt($(e).val()), 6));
        });
        //
        scores = scs;
        checkScores();
    };
    const createScorePackets = () => {
        const map = ['round', 'src', 'dest', 'val', 'client'];
        const S = scores;
        const a = [];
        S.forEach((s, i) => {
            const p = s.split('_');
            const o = {};
            p.forEach((sp, j) => {
                o[map[j]] = parseInt(sp);
            });
            a.push(o);
        });
        return a;
    };
    const resetAll = () => {
//        $('input').val(0);
//        $('.res').html(0);
//        getAndRenderGame();
//        storeState();
        scores = scoresTemp.slice();
        scorePackets = createScorePackets();
        updateScoreboard();
    };
    const toggleEditable = () => {
        const hasClicks = $('.clickable').length > 0;
        mode = hasClicks ? 1 : 0;
        let conf = true;
        if (hasClicks) {
            scoresTemp = scores.slice();
            setTimeout(() => {
//                alert('Note: you have entered Full Edit Mode, be careful!');
            }, 500);

        } else {
//            conf = confirm('You have unsubmitted changes, want to continue?');
        }
        if (conf) {
            $('td.input').each(function () {
                const $td = $(this);
                const isInput = $td.find('input').length > 0;
                if (isInput) {
                    // Toggle back to plain text
                    const val = $td.find('input').val();
                    $td.html(val);
                    $td.addClass('clickable');
                } else {
                    // Toggle to input field


                    const val = $td.text().trim();
                    $td.html(`<input type="number" value="${val}">`);
                    $td.removeClass('clickable');
                    $td.on('change', () => {
                        scores = getScoresFromBoard();
                        scorePackets = createScorePackets();
//                        console.log(scorePackets);
                        updateScoreboard();
                    })
                }
            });
            makeClickables(!hasClicks);
        }

};
    const getAndRenderGame = () => {
        console.log('getting game to render', gameID)
        socket.emit('getGame', gameID, (m) => {
            console.log('i have the game, render can complete');
            console.log(m);
            updateScores(m);
        });
    };
    const init = () => {
//        console.log(`init`);
        socket = io('', {
            query: {
                role: 'scoretest',
                id: gameID
            }
        });
        console.log('socket', socket);
        socket.on('gameUpdate', (game) => {
            console.log('update heard')
            onUpdate(window.clone(Object.assign({method: 'gameUpdate'}, game)));
        });
        window.renderTemplate('insertion', 'dev_scoretest', { teams: teams }, () => {
            $('#reset').off('click').on('click', resetAll);
            $('#send').off('click').on('click', sendScores);
            $('#all').off('click').on('click', toggleEditable);
            const r = $('.inputs');
            r.each((i, row) => {
                const ci = $(row).find('.ci');
                ci.each((j, c) => {
                    if (i === j) {
                        $(c).attr('disabled', true);
                        $(c).css({'background-color': '#767676'})
                        $(c).val('');
                    }
                })
            });
            getAndRenderGame();
        });
    };
    const initV1 = () => {
        socket.emit('getGame', gameID, (m) => {
            console.log('is me? ');
//            console.log(m);
            updateScores(m);
        });
//        return;
        window.renderTemplate('insertion', 'dev_scoretest', { teams: teams }, () => {
            // Restore input values
            const storedInputValues = JSON.parse(localStorage.getItem('inputValues')) || {};
            $('input').each((i, ip) => {
                $(ip).val(storedInputValues[i] || 0);
            });

            // Restore .res contents
            const storedResContents = JSON.parse(localStorage.getItem('resContents')) || {};
            $('.res').each(function () {
                const id = $(this).attr('id');
                $(this).html(storedResContents[id] || 0);
            });
            /*
            // Event listeners
            $(document).on('change', 'input', calc);
            $(document).on('input', 'input', function () {
                if (this.id !== 'gameID') {
                    this.value = this.value
                        .replace(/[^0-9-]/g, '')      // allow digits and minus sign
                        .replace(/(?!^)-/g, '')       // remove minus sign if not at start
                        .slice(0, 3);                 // limit to 3 chars (to allow -99)
                }
            });
            $(document).on('focus', 'input', function () {
                $(this).attr('type', $(this).attr('id') === 'gameID' ? 'text' : 'number');
//                console.log();
            });
            */
            $('#reset').off('click').on('click', resetAll);
            $('#send').off('click').on('click', sendScores);
            $('#all').off('click').on('click', toggleEditable);
            const r = $('.inputs');
            r.each((i, row) => {
                const ci = $(row).find('.ci');
                ci.each((j, c) => {
                    if (i === j) {
                        $(c).attr('disabled', true);
                        $(c).css({'background-color': '#767676'})
                        $(c).val('')
                    }
                })
            })
//            calc();

        });
    };
    const updateScores = (g) => {
        console.log('update scores scorecalc', Boolean(g), typeof(g), g);
        if (typeof(g) === 'object') {
            game = g;
            if (g.scores.sort().toString() !== scores.sort().toString()) {
                scores = g.scores;
                scorePackets = createScorePackets();

            }
            updateScoreboard();
        } else {
            console.log(`no game found - check that the dashboard is running`);
        }
    };
    const getScoresFromBoard = () => {
        const I = $('.input');
        const ar = [];
        I.each((n, i) => {
            const v = $(i).find('input').val() || 0;
            const s = $(i).attr('id').replace('_v_', `_${v}_`).split('_').slice(1).join('_');
            console.log($(i).attr('id'), s);
            ar.push(s);
        });

        return ar;
    };
    const sendScores = async () => {
        const o = {};

        const pw = window.prompt('enter the admin password');
//        const pw = 'c';
        const gid = $('#gameID');
//        console.log(game);
        o.pw = pw;
        o.scores = getScoresFromBoard();
        if (game) {
            o.gameID = `game-${game.uniqueID}`;
        } else {
            if (gid.val()) {
                o.gameID = `game-${gid.val()}`;
            }
        }
//        console.log(`sendScores`)
//        console.log(o.scores.sort())

        socket.emit('sendScores', o, (ro) => {
            console.log('dunne', ro.msg);
            console.log(ro);
        });
    };
    const onUpdate = (game) => {
        console.log('an update', game);
        updateScores(game);
    }
    const initScoreboard = (gid) => {
        // needs a game ID in order to launch
        gameID = gid.replace('/game-', '');
        console.log(`initScoreboard: ${gid} ${gameID}`);
        if (gameID) {
            init();
        }
    };

    window.initScoreboard = initScoreboard;
    window.getScoresSummary = processData;
//    init();
});
