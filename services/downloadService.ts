
export function generateFlipbookHtml(images: string[], title: string): string {
  const pagesHtml = images.map((img, i) => `
    <div class="page-node">
        <div class="page-inner">
            <img src="${img}" alt="Page ${i + 1}" />
        </div>
    </div>
  `).join('');

  const thumbnailsHtml = images.map((img, i) => `
    <button class="thumb-btn" data-page="${i + 1}" onclick="jumpToPage(${i + 1})">
        <img src="${img}" />
    </button>
  `).join('');

  const persistenceId = btoa(title).substring(0, 16);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>${title}</title>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/blasten/turn.js/turn.min.js"></script>
    <style>
        :root {
            --bg-deep: #060913;
            --nav-bg: rgba(255, 255, 255, 0.08);
            --nav-hover: rgba(255, 255, 255, 0.15);
            --accent: #6366f1;
            --panel-bg: rgba(0, 0, 0, 0.6);
            --glass: rgba(255, 255, 255, 0.1);
            --text-main: #ffffff;
            --text-dim: #94a3b8;
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body, html { 
            margin: 0; padding: 0; width: 100%; height: 100%; 
            background: var(--bg-deep); overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        #canvas {
            width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            background: var(--bg-deep);
            position: relative;
        }
        
        #flipbook-wrapper {
            width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            position: relative;
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #flipbook {
            box-shadow: 0 50px 100px rgba(0,0,0,0.9);
            background: #000;
            visibility: hidden;
        }

        .page-node { background-color: #000; width: 100%; height: 100%; }
        .page-inner {
            width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            background: #000; position: relative;
        }
        .page-inner img {
            max-width: 100%; max-height: 100%;
            object-fit: contain; display: block;
            pointer-events: none;
        }

        /* Spine shadow */
        .double .page-node:nth-child(even) .page-inner::after {
            content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: 40px;
            background: linear-gradient(to left, rgba(0,0,0,0.4), transparent);
            pointer-events: none;
        }
        .double .page-node:nth-child(odd) .page-inner::after {
            content: ""; position: absolute; top: 0; left: 0; bottom: 0; width: 40px;
            background: linear-gradient(to right, rgba(0,0,0,0.4), transparent);
            pointer-events: none;
        }

        /* Nav Buttons */
        .nav-btn {
            position: absolute; top: 50%; transform: translateY(-50%);
            width: 70px; height: 70px;
            background: var(--nav-bg);
            backdrop-filter: blur(20px);
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex; align-items: center; justify-content: center;
            color: white; cursor: pointer;
            z-index: 1000; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none; opacity: 0;
        }
        body:hover .nav-btn { opacity: 1; }
        .nav-btn:hover { background: var(--nav-hover); border-color: rgba(255,255,255,0.3); transform: translateY(-50%) scale(1.05); }
        .nav-btn.prev { left: 40px; }
        .nav-btn.next { right: 40px; }
        .nav-btn svg { width: 32px; height: 32px; stroke-width: 2.5; }

        /* Main Control Panel */
        .panel {
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: var(--panel-bg); backdrop-filter: blur(30px);
            padding: 10px 24px; border-radius: 50px;
            display: flex; align-items: center; gap: 16px;
            border: 1px solid rgba(255,255,255,0.08); z-index: 2000;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .info { color: white; font-weight: 800; font-size: 13px; min-width: 80px; text-align: center; font-variant-numeric: tabular-nums; }
        
        .btn {
            background: transparent; border: none; color: var(--text-dim);
            width: 38px; height: 38px; border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s;
        }
        .btn:hover { background: rgba(255,255,255,0.1); color: white; }
        .btn.active { background: var(--accent); color: white; }
        .btn svg { width: 20px; height: 20px; }

        .slider-ctrl { display: flex; align-items: center; gap: 12px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 16px; }
        input[type=range] { width: 120px; accent-color: var(--accent); cursor: pointer; height: 4px; }

        /* Thumbnails Strip */
        #thumbs-strip {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: rgba(0,0,0,0.9); backdrop-filter: blur(40px);
            padding: 20px 40px; transform: translateY(100%);
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; gap: 15px; overflow-x: auto; z-index: 3000;
            border-top: 1px solid rgba(255,255,255,0.1);
            scrollbar-width: none;
        }
        #thumbs-strip.visible { transform: translateY(0); }
        .thumb-btn {
            flex: 0 0 100px; height: 140px; border-radius: 12px;
            overflow: hidden; border: 2px solid transparent;
            cursor: pointer; transition: all 0.3s; opacity: 0.5;
            background: #111; padding: 0;
        }
        .thumb-btn img { width: 100%; height: 100%; object-fit: cover; }
        .thumb-btn.active { border-color: var(--accent); opacity: 1; transform: scale(1.05); }

        /* Notes UI */
        .note-btn {
            position: absolute; top: 12%; z-index: 100;
            background: #facc15; border: none; width: 34px; height: 34px; border-radius: 50%;
            cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            transition: transform 0.2s; display: flex; align-items: center; justify-content: center; font-weight: bold;
        }
        .note-btn:hover { transform: scale(1.1); }
        .note-btn.has-content { background: #fbbf24; }
        
        .note-modal {
            position: fixed; inset: 0; background: rgba(0,0,0,0.8);
            backdrop-filter: blur(5px); z-index: 5000;
            display: none; align-items: center; justify-content: center;
        }
        .note-modal.visible { display: flex; }
        .note-card {
            background: #fef9c3; padding: 30px; border-radius: 30px;
            width: 340px; transform: rotate(1deg); position: relative;
            box-shadow: 0 50px 100px rgba(0,0,0,0.5);
        }
        .note-card textarea {
            width: 100%; height: 180px; background: transparent;
            border: none; outline: none; font-size: 16px; color: #713f12;
            font-family: inherit; resize: none;
        }

        @media (max-width: 900px) {
            .nav-btn { display: none; }
            .panel { width: 95%; gap: 8px; bottom: 20px; padding: 8px 16px; }
            .slider-ctrl { display: none; }
        }
    </style>
</head>
<body>
    <div id="canvas">
        <div id="flipbook-wrapper">
            <div class="nav-btn prev" id="p-nav" onclick="goPrev(event)">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </div>
            
            <div id="flipbook">
                ${pagesHtml}
            </div>

            <div class="nav-btn next" id="n-nav" onclick="goNext(event)">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </div>
        </div>
    </div>

    <div id="thumbs-strip">
        ${thumbnailsHtml}
    </div>

    <div class="panel">
        <button class="btn" id="s-btn" title="Single Page" onclick="setMode('single', event)">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <button class="btn active" id="d-btn" title="Double Spread" onclick="setMode('double', event)">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M3 12h18M3 17h18"/></svg>
        </button>
        
        <div class="info"><span id="pg">1</span> / ${images.length}</div>

        <div class="slider-ctrl">
            <input type="range" min="1" max="${images.length}" value="1" id="page-slider" oninput="jumpToPage(this.value)">
        </div>

        <button class="btn" id="a-btn" title="Auto Play" onclick="toggleAuto(event)">
            <svg id="play-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
        </button>
        <button class="btn" id="t-btn" title="Thumbnails" onclick="toggleThumbs(event)">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
        </button>
        <button class="btn" title="Fullscreen" onclick="toggleFs()">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
        </button>
    </div>

    <div class="note-modal" id="note-modal">
        <div class="note-card">
            <textarea id="note-text" placeholder="Type your notes here..."></textarea>
            <div style="font-size: 10px; color: #a16207; opacity: 0.6; margin-top: 10px; text-transform: uppercase;">Saved Locally</div>
        </div>
    </div>

    <script>
        var book = $('#flipbook');
        var autoInt = null;
        var persistenceKey = "notes_${persistenceId}";
        var notes = JSON.parse(localStorage.getItem(persistenceKey) || "{}");
        var activeNotePage = null;

        function goPrev(e) { if(e) e.stopPropagation(); book.turn('previous'); }
        function goNext(e) { if(e) e.stopPropagation(); book.turn('next'); }

        function toggleFs() {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        }

        function toggleAuto(e) {
            if(e) e.stopPropagation();
            if(autoInt) {
                clearInterval(autoInt); autoInt = null; $('#a-btn').removeClass('active');
            } else {
                $('#a-btn').addClass('active');
                autoInt = setInterval(function() {
                   if(book.turn('page') >= book.turn('pages')) { toggleAuto(); }
                   else { book.turn('next'); }
                }, 3500);
            }
        }

        function toggleThumbs(e) {
            if(e) e.stopPropagation();
            $('#thumbs-strip').toggleClass('visible');
            $('#t-btn').toggleClass('active');
        }

        function jumpToPage(p) {
            book.turn('page', p);
        }

        function setMode(m, e) {
            if (e) e.stopPropagation();
            book.turn('display', m);
            $('.btn').removeClass('active');
            if (m === 'single') { $('#s-btn').addClass('active'); $('#flipbook').removeClass('double'); }
            else { $('#d-btn').addClass('active'); $('#flipbook').addClass('double'); }
            handleResize();
        }

        function handleResize() {
            var w = $(window).width();
            var h = $(window).height();
            var m = book.turn('display');
            var ratio = (m === 'double') ? 1.414 : 0.707;
            var targetH = h * 0.82; 
            var targetW = targetH * ratio;
            if (targetW > w * 0.9) { targetW = w * 0.9; targetH = targetW / ratio; }
            book.turn('size', targetW, targetH);
            updateNavVisibility();
            updateNoteButtons();
        }

        function updateNavVisibility() {
            var page = book.turn('page');
            var total = book.turn('pages');
            $('#p-nav').css('opacity', page === 1 ? '0.1' : '1');
            $('#n-nav').css('opacity', page === total ? '0.1' : '1');
            $('#pg').text(page);
            $('#page-slider').val(page);
            $('.thumb-btn').removeClass('active');
            $('.thumb-btn[data-page="'+page+'"]').addClass('active');
        }

        function openNote(p, e) {
            if(e) e.stopPropagation();
            activeNotePage = p;
            $('#note-text').val(notes[p] || "");
            $('#note-modal').addClass('visible');
        }

        function closeNote() {
            if (activeNotePage !== null) {
                notes[activeNotePage] = $('#note-text').val();
                localStorage.setItem(persistenceKey, JSON.stringify(notes));
            }
            $('#note-modal').removeClass('visible');
            updateNoteButtons();
        }

        function updateNoteButtons() {
            $('.note-btn').remove();
            var currentPage = book.turn('page');
            var display = book.turn('display');
            var nodes = $('.page-node');
            nodes.each(function(i){
                var p = i + 1;
                if (p === currentPage || (display === 'double' && (p === currentPage + 1 || p === currentPage - 1))) {
                    var side = (p % 2 === 0) ? 'right' : 'left';
                    var hasNote = !!notes[p];
                    var btn = $('<button class="note-btn">' + (hasNote ? '!' : '+') + '</button>');
                    btn.css(side, '12%');
                    btn.click(function(e){ openNote(p, e); });
                    if(hasNote) btn.addClass('has-content');
                    $(this).find('.page-inner').append(btn);
                }
            });
        }

        $(window).ready(function() {
            var startDisplay = ($(window).width() > 900) ? 'double' : 'single';
            if (startDisplay === 'single') { $('#d-btn').removeClass('active'); $('#s-btn').addClass('active'); }
            else { $('#flipbook').addClass('double'); }
            book.turn({
                display: startDisplay,
                acceleration: true,
                duration: 1100,
                autoCenter: true,
                when: { 
                    turned: function(e, p) { 
                        updateNavVisibility(); 
                        updateNoteButtons();
                    } 
                }
            });
            book.css('visibility', 'visible');
            $(window).resize(handleResize);
            handleResize();
            $(window).click(function() { if($('#note-modal').hasClass('visible')) closeNote(); });
            $('.note-card').click(function(e){ e.stopPropagation(); });
            $(window).keydown(function(e) { 
                if (e.keyCode == 37) goPrev(); 
                if (e.keyCode == 39) goNext(); 
            });
        });
    </script>
</body>
</html>`;
}
