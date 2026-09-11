//popup
$(document).ready(function(){
    $('.popupopen').click(function(){ //공지사항 첫번째 리스트를 클릭하면 
        $('.popup').fadeIn(0); //팝업보이게 처리
    });
    $('button').click(function(){ //닫기 클릭하면
        $('.popup').fadeOut(0); //팝업안보이게 처리
    });
});

//gnb
$(document).ready(function(){
    //hover : 마우스엔터와 마우스리브를 번갈아 실행하는 메서드
    $('.gnb').hover(function(){
        //마우스엔터 시 코드
        $('.subnav').stop().slideDown('fast');
    },function(){
        //마우스리브 시 코드
        $('.subnav').stop().slideUp('fast');
    });
});

//main
$(document).ready(function(){
    //이미지가 위로 3초마다 이동
    setInterval(function(){
        $('.main ul').animate({
            top: '-=' + 300 //이미지 높이만큼 위로 올라감
        },'slow',function(){
            //움직임이 다 일어나고 나서 줄 명령 작성
            $('.main li').first().appendTo('.main ul');
            $('.main ul').css('top',0);
        });
    },3000);
});

//board
$(document).ready(function(){
    $('.btn a').click(function(){
        $('.btn a').removeClass('active'); //모든 버튼활성화 제거 후
        $(this).addClass('active'); //클릭한 버튼만 활성

        //클릭한 부모의 인덱스번호를 담는 변수
        var index = $(this).parent().index();

        $('.bwrap > div').stop().fadeOut(0); //모든 .bwrap의 자손은 안보이게 처리
        $('.bwrap > div').eq(index).stop().fadeIn(0); //클릭한 a의 부모의 인덱스번호와 같은 자손만 보이게 처리
    });
});