/**
 * @file js/constants.js
 * @description 애플리케이션에서 사용되는 상수 데이터를 관리합니다.
 */

// 사용 가능한 TTS 음성 목록
export const TTS_VOICES = [
    { name: 'Achernar', gender: '여성', desc: '부드러움' }, { name: 'Aoede', gender: '여성', desc: '산뜻함' },
    { name: 'Autonoe', gender: '여성', desc: '밝음' }, { name: 'Callirrhoe', gender: '여성', desc: '느긋함' },
    { name: 'Despina', gender: '여성', desc: '부드러움' }, { name: 'Erinome', gender: '여성', desc: '명확함' },
    { name: 'Gacrux', gender: '여성', desc: '성숙함' }, { name: 'Kore', gender: '여성', desc: '단호함' },
    { name: 'Laomedeia', gender: '여성', desc: '경쾌함' }, { name: 'Leda', gender: '여성', desc: '젊음' },
    { name: 'Pulcherrima', gender: '여성', desc: '당참' }, { name: 'Sulafat', gender: '여성', desc: '따뜻함' },
    { name: 'Vindemiatrix', gender: '여성', desc: '온화함' }, { name: 'Zephyr', gender: '여성', desc: '밝음' },
    { name: 'Achird', gender: '남성', desc: '친근함' }, { name: 'Algenib', gender: '남성', desc: '거침' },
    { name: 'Algieba', gender: '남성', desc: '부드러움' }, { name: 'Alnilam', gender: '남성', desc: '단단함' },
    { name: 'Charon', gender: '남성', desc: '유익함' }, { name: 'Enceladus', gender: '남성', desc: '숨소리' },
    { name: 'Fenrir', gender: '남성', desc: '흥분함' }, { name: 'Iapetus', gender: '남성', desc: '명확함' },
    { name: 'Orus', gender: '남성', desc: '단단함' }, { name: 'Puck', gender: '남성', desc: '경쾌함' },
    { name: 'Rasalgethi', gender: '남성', desc: '유익함' }, { name: 'Sadachbia', gender: '남성', desc: '활기참' },
    { name: 'Sadaltager', gender: '남성', desc: '박식함' }, { name: 'Schedar', gender: '남성', desc: '차분함' },
    { name: 'Umbriel', gender: '남성', desc: '느긋함' }, { name: 'Zubenelgenubi', gender: '남성', desc: '평범함' }
];

// 캐릭터 성격 키워드 시스템 데이터 URL
export const PERSONALITY_DATA_URL = 'https://raw.githubusercontent.com/SJY-alpha/Marriage-Signal/main/document/CharacterKeywordSystem.json';

// 현재 애플리케이션 버전
export const CURRENT_VERSION = 2.4;
