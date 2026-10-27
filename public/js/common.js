//popup
// jQuery 4.0.0으로 코드 수정
$(function(){
    $('.popupopen').on('click', function(event){ //공지사항 첫번째 리스트를 클릭하면 
        event.preventDefault();
        $('.popup').stop(true, true).fadeIn(0); //팝업보이게 처리
    });
    $('.popup button').on('click', function(){ //닫기 클릭하면
        $('.popup').stop(true,true).fadeOut(0); //팝업안보이게 처리
    });


    //gnb
    //hover : 마우스엔터와 마우스리브를 번갈아 실행하는 메서드
    $('.gnb').on('mouseenter', function(){
        //마우스엔터 시 코드
        $('.subnav').stop(true, true).slideDown('fast');
    }).on('mouseleave' , function() { //마우스리브 시 코드
        $('.subnav').stop(true, true).slideUp('fast');
    });


    //main
    const $mainList = $('.main ul');

    if ($mainList.length > 0) {
        window.setInterval(function() {
            $mainList.animate({top: '-=300'}, 'slow', function() {
                $mainList
                    .children('li')
                    .first()
                    .appendTo($mainList);
                $mainList.css('top', 0);
                        }
                );
            },
            3000
        );
    }


//board
    $('.btn a').on('click', function(event){
        event.preventDefault(); //모든 버튼활성화 제거 후
        const $selectedButton = $(this); //클릭한 버튼만 활성

        //클릭한 부모의 인덱스번호를 담는 변수
        const selectedIndex = $selectedButton
            .parent()
            .index();

        $('.btn a').removeClass('active');
        
        $selectedButton.addClass('active');

        $('.bwrap > div').stop(true, true).fadeOut(0); //모든 .bwrap의 자손은 안보이게 처리
        $('.bwrap > div').eq(index).stop(true, true).fadeIn(0); //클릭한 a의 부모의 인덱스번호와 같은 자손만 보이게 처리
    });
});