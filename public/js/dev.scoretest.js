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
    const gameID = 'vik6'; /* hard coded in dev */
    const socket = io('', {
        query: {
            role: 'scoretest',
            id: gameID
        }
    });
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
    let scorePackets = [];
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
//        console.log(`calc`)
        buildScores();
        scorePackets = createScorePackets();
//        displayTotals();
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
            const pv1_1 = gss(5, grs(2))[i]; /* first PV1 score  */
            const pv1_2 = gss(6, grs(2))[i]; /* first PV2 score  */
            const pvt1 = gtv(gds(i, grs(2))); /* first PV total */
            const apv1 = gsv(a1) * pvt1;
            const collArray = gds(i, grs(4));
            const collScores = [];
            const pv2_1 = gss(5, grs(5))[i]; /* second PV1 score  */
            const pv2_2 = gss(6, grs(5))[i]; /* second PV2 score  */
            const pvt2 = gtv(gds(i, grs(5))); /* second PV total */
            const acpvf = (gtv(gds(i, grs(3))) + gtv(gds(i, grs(4)))) * gtv(gds(i, grs(5))); /* formula P */
            for (let j = 0; j < T; j++) {
                const coll = gds(i, grs(4));
                const coll2 = gds(i, collArray);
                const collScoreArr = gss(j, coll2);
//                const collScore = collScoreArr.length ? gsv(collScoreArr[0]) : '-';
                const collScore = collScoreArr.length ? collScoreArr[0] : '-';
                collScores.push(collScore);
                const sc = getScoreValue(coll[j]);
                const f = (sc / at) * acpvf;
                shArray.push(f);
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
        }
        Object.values(out).forEach((r, i) => {
            for (let j = 0; j < T; j++) {
                r.shArray.push(shArray[(j * T) + i]);
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
    const processDataV1 = () => {
        // creates a scores object for display
        const out = {};
        const T = 5;
        const gtv = getTotalVals;
        const gds = getDestScores;
        const grs = getRoundScores;
        const gsv = getScoreValue;
        let shArray = new Array();
        let shTotal = new Array(5).fill(0);
        let c = 0;
        for (let i = 0; i < T; i++) {
            const a = gsv(grs(1)[i]);
            const t = gtv(gds(i, grs(4)));
            const at = gtv(gds(i, grs(3))) + gtv(gds(i, grs(4))); /* formula N */
            const pv1 = gtv(gds(i, grs(2))); /* first PV total */
            const apv1 = a * pv1;
            const pv2 = gtv(gds(i, grs(5))); /* second PV total */
            const acpvf = (gtv(gds(i, grs(3))) + gtv(gds(i, grs(4)))) * gtv(gds(i, grs(5))); /* formula P */
            for (let j = 0; j < T; j++) {
                const coll = gds(i, grs(4));
                const sc = getScoreValue(coll[j]);
                const f = (sc / at) * acpvf;
                shArray.push(f);
                if (!isNaN(f)) {
                    shTotal[i] += f;
                }
            };
            out[`r${i}`] = {
                collTotal: t,
                allCollTotal: at,
                pv1: pv1,
                total2030: apv1,
                pv2: pv2,
                allCollPV: acpvf,
                shTotal: shTotal,
                shArray: []
            };
        }
        Object.values(out).forEach((r, i) => {
            for (let j = 0; j < T; j++) {
                r.shArray.push(shArray[(j * T) + i]);
            }
            r.shTotal = r.shArray.reduce((total, num) => total + (isNaN(num) ? 0 : num), 0);
            r.scorePlusShare = r.shTotal + r.allCollPV;
            r.grandTotal = r.scorePlusShare + r.total2030;
        });

//        console.log(out);
//        Object.values(out).forEach(r => {console.log(r)});
        return out;
    };
    const renderFormSummary = (o) => {
        const S = $('#formSummary');
        const T = game.persistentData.teamsArray;
//        console.log(S);
        let s = '<table class="formSummary">';
        s += `<tr><td>round:</td><td>${o.round}</td></tr>`;
        s += `<tr><td>source:</td><td>${T[o.src].title}</td></tr>`;
        s += `<tr><td>dest:</td><td>${T[o.dest].title}</td></tr>`;
        s += '</table>';
        S.html(s);
//        console.log(game);
    };
    const openForm = (o) => {
        console.log(o);
        console.log(o.idOb);
        console.log(o.scoreSub);
//        return;
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
//            console.log(sc);
//            console.log(score);
//            return;
            socket.emit('forceScore', {scoreCode: sc, scorePacket: score, game: game.uniqueID}, (o) => {
//                console.log('dunne', o);
                game.scores = o;
                updateScores(game);
            });
        });
    };
    const makeClickables = (boo) => {
        $('.input').off('click');
        $('#all').html(boo ? 'Full Edit Mode' : 'Single Score Edit Mode')
        if (boo) {
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
                        msg = `No score set, you can probably set one.`;
                        safeScore = true;
                    }
                }
                if (!safeScore) {
                    msg += ' You can still set a score but this is a risky operation and may cause problems to occur.'
                }
                openForm({safeScore: safeScore, msg: msg, val: $(this).html() || 0, sp: sp, idOb: idOb, scoreSub: generateScoreSubmission(idOb)});
                generateScoreSubmission(idOb);
            });
        }
    };
    const updateScoreboard = () => {
        const T = processData();
        const R = $('.inputs');
        R.find('input').css({width: '20px;'});
        if (Object.values(T).length !== R.length) {
            console.log('data error: mismatch between processed team scores and display rows');
        } else {
            R.each((i, ri) => {
                const r = $(ri);
                const t = Object.values(T)[i];
                const a1 = $(r.find('.a1'));
                const pv1_1 = $(r.find('.pv_1_1'));
                const pv1_2 = $(r.find('.pv_1_2'));
                const pvt1 = $(r.find('.pvt1'));
                const total2030 = $(r.find('.2030total'));
                const a2 = $(r.find('.a2'));
                const totalColl = $(r.find('.ctotal'));
                const allCollTotal = $(r.find('.allCollTotal'));
                const pv2_1 = $(r.find('.pv_2_1'));
                const pv2_2 = $(r.find('.pv_2_2'));
                const pvt2 = $(r.find('.pvt2'));
                const allCollPV = $(r.find('.allCollPV'));
                const shTotal = $(r.find('.shTotal'));
                const scoreShare = $(r.find('.scoreShare'));
                const total2040 = $(r.find('.2040total'));
                const sh = r.find('.sval');
                sh.each((j, s) => {
                    const v = t.shArray[j];
                    $(s).html(v);
                    $(s).removeClass('blank');
                    if (i === j) {
                        $(s).addClass('blank');
                    }
                });
                a1.html(getScoreValue(t.a1));
                a1.data('scorePacket', t.a1);
                pv1_1.html(getScoreValue(t.pv1_1));
                pv1_1.data('scorePacket', t.pv1_1);
                pv1_2.html(getScoreValue(t.pv1_2));
                pv1_2.data('scorePacket', t.pv1_2);
                pvt1.html(t.pvt1);
                total2030.html(t.total2030);
                const C = r.find('.c');
                C.each((j, c) => {
                    $(c).html(getScoreValue(t.collScores[j]));
                    $(c).data('scorePacket', t.collScores[j]);
                    if (i === j) {
                        $(c).addClass('blank');
                        $(c).removeClass('input');
                    }
                });
                // 2040
                a2.html(getScoreValue(t.a2));
                a2.data('scorePacket', t.a2);
                totalColl.html(t.collTotal);
                allCollTotal.html(t.allCollTotal);
                pv2_1.html(getScoreValue(t.pv2_1));
                pv2_1.data('scorePacket', t.pv2_1);
                pv2_2.html(getScoreValue(t.pv2_2));
                pv2_2.data('scorePacket', t.pv2_2);
                pvt2.html(t.pvt2);
                allCollPV.html(t.allCollPV);
                shTotal.html(t.shTotal);
                scoreShare.html(t.scorePlusShare);
                total2040.html(t.grandTotal);
            });
            makeClickables(true);
        }
    };
    const displayTotals = () => {
        // deprecated method, see updateScoreboard
        const T = processData();
//        console.log(T);
        const R = $('.inputs');
        if (Object.values(T).length !== R.length) {
            console.log('data error: mismatch between processed team scores and display rows');
        } else {
            R.each((i, ri) => {
                const r = $(ri);
                const t = Object.values(T)[i];
                const pvt1 = $(r.find('.pvt1'));
                const total2030 = $(r.find('.2030total'));
                const totalColl = $(r.find('.ctotal'));
                const allCollTotal = $(r.find('.allCollTotal'));
                const pvt2 = $(r.find('.pvt2'));
                const allCollPV = $(r.find('.allCollPV'));
                const shTotal = $(r.find('.shTotal'));
                const scoreShare = $(r.find('.scoreShare'));
                const total2040 = $(r.find('.2040total'));
                //
                const sh = r.find('.sval');
                sh.each((j, s) => {
                    const v = t.shArray[j];
                    $(s).html(v);
                    $(s).removeClass('blank');
                    if (i === j) {
                        $(s).addClass('blank');
                    }
                });
                pvt1.html(t.pv1);
                total2030.html(t.total2030);
                totalColl.html(t.collTotal);
                allCollTotal.html(t.allCollTotal);
                pvt2.html(t.pv2);
                allCollPV.html(t.allCollPV);
                shTotal.html(t.shTotal);
                scoreShare.html(t.scorePlusShare);
                total2040.html(t.grandTotal);
            })
        }
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
        $('input').val(0);
        $('.res').html(0);
        getAndRenderGame();
        storeState();
    };
    const toggleEditable = () => {
        const hasClicks = $('.clickable').length > 0;
        let conf = true;
        if (hasClicks) {
            setTimeout(() => {
                alert('Note: you have entered Full Edit Mode, be careful!');
            }, 500);
        } else {
            conf = confirm('You have unsubmitted changes, want to continue?');
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
                    $td.html(`<input type="number" value="${val}" style="width: 100%; box-sizing: border-box;">`);
                    $td.removeClass('clickable');
    //                alert('moose');
                }

            });
            makeClickables(!hasClicks);
        }

};
    const getAndRenderGame = () => {
        socket.emit('getGame', gameID, (m) => {
            updateScores(m);
        });
    };
    const init = () => {
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
//            console.log('is me? ');
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
        if (g) {
            game = g;
            if (g.scores.sort().toString() !== scores.sort().toString()) {
                scores = g.scores;
                scorePackets = createScorePackets();

            }
//            console.log('hup', g);
            updateScoreboard();
        } else {
            alert('no game f0und - check that the dashboard is running');
        }
    }
    const sendScores = async () => {
        const o = {scores: scores};
        console.log(o);
        return;
        const pw = window.prompt('enter the admin password');
//        const pw = 'c';
        const gid = $('#gameID');

        o.pw = pw;
        if (gid.val()) {
            o.gameID = `game-${gid.val()}`;
        }
        socket.emit('sendScores', o, (ro) => {
            console.log('dunne', ro.msg);
        });
    };
    const onUpdate = (game) => {
//        console.log('an update', game);
        updateScores(game);
    }

    socket.on('gameUpdate', (game) => {
        onUpdate(window.clone(Object.assign({method: 'gameUpdate'}, game)));
    });
    init();
});
