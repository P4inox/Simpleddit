// Global Variables

var maxNest = 15;
var after = null;
var count = 0;
var limit = 47;
var sort = "hot";
var spinner_html = "Loading <img id='loadgif' src='images/ajax-loader.gif' />";
var frontpage_html = "<a target='_blank' href='http://www.reddit.com/'>Front Page</a> <span id='reload-button' class='glyphicon glyphicon-repeat'></span>";
var OP = "";
var id="";
var ResultLimit = 40;
var ht = $(window).height();
var options_mode = 0;

var ignore_subs = ['blog'];



$(function()
{
    init();
    hashLocation();
    setTitle();
    getPopularSubs();
    buildHandlebars();

    if (logged_in == 1){
        sub = defsubs;
    }
    getItems(sub, sort);
}); 


// ** FUNCTIONS ** //

function init()
{

    if(logged_in == 1)
    {
        $("#login-button").html("<span id='logout'>logout</span>");
    }

    if(readCookie("theme") == "dark")
    {
        $('<link/>', {rel: 'stylesheet', href: 'themes/dark.css', id: 'theme-style'}).appendTo('head');
        $("#select-theme>option:eq(0)").attr("selected", true);
    }

    if(readCookie("showLogo") == "0")
    {
        $("#logo").hide();
        $("#logo-filler").show();
        document.getElementById("hide-logo").checked = true;
    }
    else
    {
        createCookie("showLogo", "1", 30);
        document.getElementById("hide-logo").checked = false;
    }

    if(readCookie("nsfw")=="on")
    {
        document.getElementById("hide-nsfw").checked = false;
    }
    else
    {
        createCookie("nsfw", "off", 2);
    }

    if(readCookie("title")!=null)
    {
        $("#input-title").val(readCookie("title"));
    }
    
    if(readCookie("gif"))
    {
        document.getElementById("hide-gif").checked = false;
    }

    if(readCookie("column"))
    {
        var colSize = readCookie("column");
        $("#column-size option[value=" + colSize + "]").attr("selected", "selected");
        setColumnWidth(colSize);
    }
}

function buildHandlebars()
{
    var raw_template = $('#entry-template').html();
    entryTemplate = Handlebars.compile(raw_template);
    entryPlaceHolder = $("#main");

    var raw_template = $('#comment-template').html();
    commentTemplate = Handlebars.compile(raw_template);

    var raw_template = $('#story-template').html();
    storyTemplate = Handlebars.compile(raw_template);
    storyPlaceHolder = $("#story");
}

function setTitle() // Set page title if cookie exists
{
    if (readCookie("title") != null)
    {
        document.title = readCookie("title");
    }
}

function ClearLeftSide() // Clear all stories
{
    $("#getmore").hide();
    $("#main").html("");
    count = 0;
    after = "";
}

function ClearRightSide() // Clear all stories
{
    $("#storyheader").html("");
    $("#about").hide();
    $("#options").hide();
    $("#story").html("");
    $("#comments").html("");
    options_mode = 0;
}

function getItems(sub, sort) // Get stories
{
    //history.replaceState(undefined, undefined, "#"+sub);

    $("#input-sub").val("");

    var subUrl         = (sub == "" ) ? "" : "/r/"+sub;
    var limitUrl     = "limit=" + limit;
    var afterUrl     = (after == null) ? "" : "&after="+after;
    var countUrl     = (count == 0) ? "" : "&count="+count;

    setSubHeader(spinner_html);

    switch(sort) 
    {    
        case "hot":
            var sortType = "hot";
            var sortUrl = "sort=hot";
            break;
        case "new":
            var sortType = "new";
            var sortUrl = "sort=new";
            break;
        case "rising":
            var sortType = "rising";
            var sortUrl = "sort=rising";
            break;
        case "day":
            var sortType = "top";
            var sortUrl = "sort=top&t=day";
            break;
        case "week":
            var sortType = "top";
            var sortUrl = "sort=top&t=week";
            break;
        case "month":
            var sortType = "top";
            var sortUrl = "sort=top&t=month";
            break;
        case "year":
            var sortType = "top";
            var sortUrl = "sort=top&t=year";
            break;
        case "controversial":
            var sortType = "controversial";
            var sortUrl = "sort=controversial";
            break;
        case "all":
            var sortType = "top";
            var sortUrl = "sort=top&t=all";
            break;
    }
    
    setSubHeader(spinner_html);
    $("#getmore").html(spinner_html);
    
    var url = "https://www.reddit.com" + subUrl + "/" + sortType + "/.json?" + sortUrl + "&" + limitUrl + afterUrl + countUrl;

    $.getJSON( url, function(data) 
    {
        $("#getmore").remove();

        listItems(data, sub);
        if(sort != "rising")
        {
            $("#getmore").show();
            $("#getmore").html("Load more...");
        }

        $("div[data-id='"+id+"']").attr("class","row entries selected");
        
        if(sub=="") // Change sub name header
        {
             setSubHeader(frontpage_html);
        } 
        else if (sub == defsubs)
        {
            setSubHeader(frontpage_html);
        }
        else 
        {
          $("#subnameheader").html("<a target='_blank' href='http://www.reddit.com/r/" + sub + "'>r/"+sub+"</a> <span id='reload-button' class='glyphicon glyphicon-repeat'></span>");
        }

        $("#rightcolumn").focus();

        if (logged_in ==1)
        {
            $("#select-sub").val("Your Subreddits");

        }
        else
        {
            $("#select-sub").val("Popular Subreddits");
        }
        
    }).fail(function(data) 
    {
        ClearLeftSide();
        $("#subnameheader").html("<div class='col-xs-12'>Could not get data from subreddit '"+sub+"'. Please make sure that this subreddit exists, or try again in a few minutes.</div>");
    });

}


function getPopularSubs() // Get top 100 subreddits
{
    // If logged in, get subscribed subs instead
    if (logged_in == 1)
    {
        defsublist = defsubs.split("+");
        defsublist.forEach(function(name) {

            $("#select-sub").append("<option value='"+name+"' label='"+name+"'>"+name+"</option>");
        });
    }
    else
    {
        $.getJSON("https://www.reddit.com/subreddits/popular/.json?limit=100", function(data)
        {
            $.each(data.data.children,function(index,element)
            { 
                $("#select-sub").append("<option value='"+element.data.display_name+"' label='"+element.data.display_name+"'>"+element.data.display_name+"</option>");
            });
        });
    }
}


function listItems(data,sub) // Append stories to the left side panel
{
    $.each(data.data.children,function(index,element)
    { 

        // Check ignore subs list
        if (ignore_subs.indexOf(element.data.subreddit) == -1) {

            // Check nsfw filter
            if((element.data.over_18==true
                    &&readCookie("nsfw")=="on")
                    ||element.data.over_18==false)
            {
                element.data.topsub = sub;
                var html = entryTemplate(element.data);
                entryPlaceHolder.append(html);
                count++;
                after = element.data.name;
            }
            
        }
    });

    $("#main").append("<div class='row'><div id='getmore' class='col-xs-12 text-center'>Load more...</div></div>");
}


function getStory(sub,id) // Get story details
{

    $("#main > .entries").attr("class","row entries");
    $("div[data-id='"+id+"']").attr("class","row entries selected"); // Highlight entry

    //history.replaceState(undefined, undefined, "#"+sub + "-" + id);

    if (sub == "")
    {
        var url = "comments/"+id;
    }
    else
    {
        var url = "r/"+sub+"/comments/"+id;
    }

    setStoryHeader(spinner_html);

    var requestUrl = "https://www.reddit.com/"+url+"/.json";

    $.getJSON(requestUrl, function(data)
    {
        ClearRightSide();
        setStoryHeader("<a target='_blank' href='https://www.reddit.com/"+url+"'>"+url+"</a>");

        $.each(data,function(index,element)
        { 
            $.each(element.data.children, function(index, element)
            {
                if(element.data.title)
                {
                    OP = element.data.author;
                    printTitle(element);
                }
                else
                {
                    printComment(element, 0, "comments");
                }
            });
        });

        // Change links to open in new window
        $("a[href^='http://']").attr("target","_blank");
        $("a[href^='https://']").attr("target","_blank");

        $("#rightcolumn").focus();


    }).fail(function(data) 
    {
        ClearRightSide();
        $("#story").html("<div class='row'><div class='col-xs-12'>Could not fetch data from Reddit. Reddit may be experiencing heavy traffic. Please try again in a few minutes.</div></div>");
    });
}

function setSubHeader(text)
{
    $("#subnameheader").html(text);
}

function setStoryHeader(text)
{
    $("#storyheader").html(text);
}

function printTitle(data)
{
    var html = storyTemplate(data.data);
    storyPlaceHolder.append(html); 
}

function printComment(data, numNest, lastComment)  // Recursive function to print comments
{
    data = data.data;

    if(data.body)
    {
        data.numNest = numNest;
        var html = commentTemplate(data);
        $("#" + lastComment).append(html);
    }

    lastComment = data.id;

    if(data.replies)
    {
        $.each(data.replies.data.children, function(index, element)
        {
            if(numNest<maxNest)
            {
                printComment(element, numNest+1, lastComment);
            }
        });
    } 
}

function htmlDecode(input)  // Unescape html
{
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

function getYoutubeId(url)  // Returns youtube data-id
{
    var videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    if(videoid != null) 
    {
       return videoid;
    } 
    else
    { 
        console.log("The youtube url is not valid.");
    }
}

function hashLocation()  // Hash sub and story navigation
{
    var hash = window.location.hash;
    if(hash!="")
    {
        var i = hash.search("-");
        if(i!=-1)
        {
            sub = hash.slice(1, i);
            ClearRightSide();
            id = hash.slice(i+1);
            getStory(sub, id);
        }
        else
        {
            sub = hash.slice(1);
        }
    }
}

function isImgurVid(url) // Returns true if url is .gifv, .webm, or .mp4
{
    var exts = [".gifv", ".webm", ".mp4"];
    for (var i in exts) 
    {
        if(url.indexOf(exts[i]) == url.length - exts[i].length) return exts[i];
    }
    return false;
}

function isAnimated(url) // Returns true if media in not just an image
{
    var exts = [".gifv", ".webm", ".mp4", ".gif"];
    for (var i in exts) 
    {
        if(url.indexOf(exts[i]) == url.length - exts[i].length) return true;
    }
    if (url.indexOf("gfycat") != -1) return true;
    if (url.indexOf("streamable") != -1) return true;
    return false;
}


function attachGfycat(url) {
    
    var id = /[^/]*$/.exec(url)[0];
    
    $.ajax({
        url:'http://gfycat.com/cajax/get/'+id,
        jsonp: 'callback',
        dataType: 'jsonp',
        success: function( response ) {
            console.log( response );
            
            $('#storyimage').html('<video width="100%" poster='+url+'-poster.jpg autoplay muted loop controls><source src="'+response.gfyItem.webmUrl+'"  type="video/webm"><source src="'+response.gfyItem.mp4Url+'"  type="video/mp4"></video>')
        }
    });
}

function setColumnWidth(size) {
    $("#leftcolumn").attr("class", "col-xs-" + size);
    $("#subnameheader").parent().attr("class", "text-center col-xs-" + size);

    $("#rightcolumn").attr("class", "scrollbar-outer col-xs-" + (12 - size));
    $("#storyheader").parent().attr("class", "text-center col-xs-" + (12 - size));
}