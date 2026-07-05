begin;

-- =============================================================================
-- 펫 종류
-- =============================================================================

insert into public.character_types (
  id,
  name,
  sprite_key,
  description,
  is_active
)
values
  (1, '고양이', 'cat', '도도하지만 정이 많은 고양이', true),
  (2, '햄스터', 'hamster', '볼주머니가 귀여운 햄스터', true),
  (3, '토끼', 'bunny', '깡총깡총 호기심 많은 토끼', true)
on conflict (id) do update
set
  name = excluded.name,
  sprite_key = excluded.sprite_key,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.character_type_stages (
  character_type_id,
  growth_stage,
  min_level,
  image_url
)
select
  character_type.id,
  stage.growth_stage::public.character_growth_stage,
  stage.min_level,
  null
from (
  values
    ('cat', 'egg', 1),
    ('cat', 'baby', 2),
    ('cat', 'child', 5),
    ('cat', 'teen', 8),
    ('cat', 'adult', 10),
    ('hamster', 'egg', 1),
    ('hamster', 'baby', 2),
    ('hamster', 'child', 5),
    ('hamster', 'teen', 8),
    ('hamster', 'adult', 10),
    ('bunny', 'egg', 1),
    ('bunny', 'baby', 2),
    ('bunny', 'child', 5),
    ('bunny', 'teen', 8),
    ('bunny', 'adult', 10)
) as stage(sprite_key, growth_stage, min_level)
join public.character_types character_type
  on character_type.sprite_key = stage.sprite_key
on conflict (character_type_id, growth_stage) do update
set
  min_level = excluded.min_level,
  image_url = excluded.image_url;

-- =============================================================================
-- 문제 카테고리
-- =============================================================================

insert into public.question_categories (
  id,
  code,
  name,
  is_active
)
values
  (1, 'web', '웹 기초', true),
  (2, 'js', '자바스크립트', true),
  (3, 'cs', '컴퓨터 상식', true),
  (4, 'english', '영어 단어', true)
on conflict (id) do update
set
  code = excluded.code,
  name = excluded.name,
  is_active = excluded.is_active;

-- =============================================================================
-- 문제
-- published 문제는 운영 중 직접 수정하지 않고 새 버전을 추가하는 것이 원칙이다.
-- =============================================================================

insert into public.questions (
  id,
  category_id,
  supersedes_question_id,
  version,
  title,
  question_text,
  explanation,
  difficulty,
  status
)
values
  (
    1,
    1,
    null,
    1,
    'HTML 약어',
    'HTML의 의미로 가장 알맞은 것은?',
    'HTML은 Hyper Text Markup Language의 약자입니다.',
    1,
    'published'
  ),
  (
    2,
    1,
    null,
    1,
    '웹페이지 스타일 언어',
    '웹페이지의 색상과 배치 등 스타일을 담당하는 언어는?',
    'CSS(Cascading Style Sheets)가 스타일을 담당합니다.',
    1,
    'published'
  ),
  (
    3,
    2,
    null,
    1,
    '자바스크립트 변수 선언',
    '자바스크립트에서 변수를 선언하는 키워드가 아닌 것은?',
    'let, const, var는 자바스크립트 변수 선언 키워드이며 int는 아닙니다.',
    2,
    'published'
  ),
  (
    4,
    1,
    null,
    1,
    'HTML 제목 태그',
    'HTML에서 가장 큰 제목을 나타내는 태그는?',
    '<h1>이 가장 큰 제목 태그입니다.',
    1,
    'published'
  ),
  (
    5,
    1,
    null,
    1,
    'HTML 링크 태그',
    '다른 페이지로 이동하는 링크를 만들 때 쓰는 태그는?',
    '<a> 태그로 하이퍼링크를 만듭니다.',
    1,
    'published'
  ),
  (
    6,
    1,
    null,
    1,
    'CSS ID 선택자',
    'CSS에서 id를 선택할 때 사용하는 기호는?',
    'CSS의 id 선택자는 # 기호를 사용합니다.',
    1,
    'published'
  ),
  (
    7,
    2,
    null,
    1,
    '자바스크립트 일치 연산자',
    '자바스크립트에서 값과 타입을 모두 비교하는 연산자는?',
    '=== 연산자는 값과 타입을 모두 비교합니다.',
    1,
    'published'
  ),
  (
    8,
    2,
    null,
    1,
    '배열 길이',
    '자바스크립트 배열의 길이를 확인하는 속성은?',
    '배열의 length 속성으로 요소 개수를 확인할 수 있습니다.',
    1,
    'published'
  ),
  (
    9,
    2,
    null,
    1,
    'JSON 문자열 변환',
    'JSON 문자열을 자바스크립트 값으로 변환하는 함수는?',
    'JSON.parse()는 JSON 문자열을 자바스크립트 값으로 변환합니다.',
    2,
    'published'
  ),
  (
    10,
    2,
    null,
    1,
    'const 특징',
    'const로 선언한 변수에 대한 설명으로 알맞은 것은?',
    'const 변수에는 새로운 값을 다시 대입할 수 없습니다.',
    2,
    'published'
  ),
  (
    11,
    3,
    null,
    1,
    'CPU 역할',
    '컴퓨터에서 명령을 해석하고 연산을 수행하는 장치는?',
    'CPU는 프로그램 명령을 해석하고 연산을 수행합니다.',
    1,
    'published'
  ),
  (
    12,
    3,
    null,
    1,
    'RAM 특징',
    '전원이 꺼지면 저장 내용이 사라지는 주기억장치는?',
    'RAM은 전원이 꺼지면 데이터가 사라지는 휘발성 메모리입니다.',
    1,
    'published'
  ),
  (
    13,
    3,
    null,
    1,
    '이진수',
    '컴퓨터가 기본적으로 사용하는 이진수의 두 숫자는?',
    '이진수는 0과 1로 표현합니다.',
    1,
    'published'
  ),
  (
    14,
    3,
    null,
    1,
    '운영체제',
    '다음 중 운영체제에 해당하는 것은?',
    'Linux는 컴퓨터 자원을 관리하는 운영체제입니다.',
    1,
    'published'
  ),
  (
    15,
    3,
    null,
    1,
    'URL 의미',
    '웹에서 자원의 위치를 나타내는 주소를 무엇이라고 하는가?',
    'URL은 웹 자원의 위치를 나타내는 주소입니다.',
    1,
    'published'
  ),
  (
    16,
    4,
    null,
    1,
    'apple 뜻',
    '영어 단어 apple의 뜻은?',
    'apple은 사과라는 뜻입니다.',
    1,
    'published'
  ),
  (
    17,
    4,
    null,
    1,
    'book 뜻',
    '영어 단어 book의 뜻은?',
    'book은 책이라는 뜻입니다.',
    1,
    'published'
  ),
  (
    18,
    4,
    null,
    1,
    'run 뜻',
    '영어 단어 run의 뜻으로 가장 알맞은 것은?',
    'run은 달리다라는 뜻입니다.',
    1,
    'published'
  ),
  (
    19,
    4,
    null,
    1,
    'happy 뜻',
    '영어 단어 happy의 뜻은?',
    'happy는 행복한이라는 뜻입니다.',
    1,
    'published'
  ),
  (
    20,
    4,
    null,
    1,
    'water 뜻',
    '영어 단어 water의 뜻은?',
    'water는 물이라는 뜻입니다.',
    1,
    'published'
  )
on conflict (id) do update
set
  category_id = excluded.category_id,
  supersedes_question_id = excluded.supersedes_question_id,
  version = excluded.version,
  title = excluded.title,
  question_text = excluded.question_text,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  status = excluded.status;

insert into public.question_choices (
  id,
  question_id,
  choice_text,
  is_correct,
  sort_order
)
values
  (1, 1, 'Hyper Text Markup Language', true, 1),
  (2, 1, 'High Tech Modern Language', false, 2),
  (3, 1, 'Home Tool Markup Language', false, 3),
  (4, 1, 'Hyperlink Text Makeup', false, 4),

  (5, 2, 'HTML', false, 1),
  (6, 2, 'CSS', true, 2),
  (7, 2, 'SQL', false, 3),
  (8, 2, 'JSON', false, 4),

  (9, 3, 'let', false, 1),
  (10, 3, 'const', false, 2),
  (11, 3, 'var', false, 3),
  (12, 3, 'int', true, 4),

  (13, 4, '<h1>', true, 1),
  (14, 4, '<p>', false, 2),
  (15, 4, '<title>', false, 3),
  (16, 4, '<big>', false, 4),

  (17, 5, '<img>', false, 1),
  (18, 5, '<a>', true, 2),
  (19, 5, '<div>', false, 3),
  (20, 5, '<link>', false, 4),

  (21, 6, '.', false, 1),
  (22, 6, '#', true, 2),
  (23, 6, '@', false, 3),
  (24, 6, '$', false, 4),

  (25, 7, '==', false, 1),
  (26, 7, '=', false, 2),
  (27, 7, '===', true, 3),
  (28, 7, '!=', false, 4),

  (29, 8, 'size', false, 1),
  (30, 8, 'count', false, 2),
  (31, 8, 'length', true, 3),
  (32, 8, 'total', false, 4),

  (33, 9, 'JSON.stringify()', false, 1),
  (34, 9, 'JSON.parse()', true, 2),
  (35, 9, 'JSON.read()', false, 3),
  (36, 9, 'JSON.convert()', false, 4),

  (37, 10, '반드시 숫자만 저장한다', false, 1),
  (38, 10, '새로운 값을 다시 대입할 수 없다', true, 2),
  (39, 10, '함수 안에서만 사용할 수 있다', false, 3),
  (40, 10, '자동으로 문자열로 변환된다', false, 4),

  (41, 11, 'CPU', true, 1),
  (42, 11, '모니터', false, 2),
  (43, 11, '키보드', false, 3),
  (44, 11, '스피커', false, 4),

  (45, 12, 'SSD', false, 1),
  (46, 12, 'HDD', false, 2),
  (47, 12, 'RAM', true, 3),
  (48, 12, 'USB 메모리', false, 4),

  (49, 13, '0과 1', true, 1),
  (50, 13, '1과 2', false, 2),
  (51, 13, 'A와 B', false, 3),
  (52, 13, 'X와 Y', false, 4),

  (53, 14, 'HTML', false, 1),
  (54, 14, 'Linux', true, 2),
  (55, 14, 'JSON', false, 3),
  (56, 14, 'CSS', false, 4),

  (57, 15, 'CPU', false, 1),
  (58, 15, 'RAM', false, 2),
  (59, 15, 'URL', true, 3),
  (60, 15, 'SQL', false, 4),

  (61, 16, '사과', true, 1),
  (62, 16, '바나나', false, 2),
  (63, 16, '포도', false, 3),
  (64, 16, '복숭아', false, 4),

  (65, 17, '연필', false, 1),
  (66, 17, '책', true, 2),
  (67, 17, '가방', false, 3),
  (68, 17, '의자', false, 4),

  (69, 18, '걷다', false, 1),
  (70, 18, '달리다', true, 2),
  (71, 18, '먹다', false, 3),
  (72, 18, '자다', false, 4),

  (73, 19, '슬픈', false, 1),
  (74, 19, '화난', false, 2),
  (75, 19, '행복한', true, 3),
  (76, 19, '피곤한', false, 4),

  (77, 20, '불', false, 1),
  (78, 20, '바람', false, 2),
  (79, 20, '흙', false, 3),
  (80, 20, '물', true, 4)
on conflict (id) do update
set
  question_id = excluded.question_id,
  choice_text = excluded.choice_text,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- =============================================================================
-- 상점 카테고리
-- =============================================================================

insert into public.item_categories (
  id,
  code,
  name,
  slot,
  target_type
)
values
  (1, 'egg_pattern', '알 무늬', 'pattern', 'egg'),
  (2, 'egg_hat', '알 모자', 'hat', 'egg'),
  (3, 'egg_nest', '알 둥지', 'nest', 'egg'),
  (4, 'pet_hat', '펫 모자', 'hat', 'pet'),
  (5, 'pet_glasses', '펫 안경', 'glasses', 'pet')
on conflict (id) do update
set
  code = excluded.code,
  name = excluded.name,
  slot = excluded.slot,
  target_type = excluded.target_type;

insert into public.shop_items (
  id,
  category_id,
  name,
  price,
  asset_key,
  is_active
)
values
  (1, 1, '꽃무늬', 40, 'pat_flower', true),
  (2, 1, '별무늬', 40, 'pat_star', true),
  (3, 1, '하트무늬', 40, 'pat_heart', true),
  (4, 2, '리본 모자', 30, 'hat_bow', true),
  (5, 2, '꼬마 왕관', 60, 'hat_crown', true),
  (6, 2, '고깔모자', 40, 'hat_party', true),
  (7, 3, '둥지', 40, 'nest_straw', true),
  (8, 3, '꽃 둥지', 70, 'nest_flower', true),
  (9, 4, '리본', 30, 'ribbon', true),
  (10, 4, '야구모자', 60, 'cap', true),
  (11, 4, '왕관', 120, 'crown', true),
  (12, 4, '마법사 모자', 150, 'wizard', true),
  (13, 5, '동그란 안경', 40, 'glasses', true),
  (14, 5, '선글라스', 50, 'sun', true),
  (15, 5, '하트 안경', 70, 'heart_g', true)
on conflict (id) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  price = excluded.price,
  asset_key = excluded.asset_key,
  is_active = excluded.is_active;

-- 명시적으로 넣은 ID 다음부터 identity가 발급되도록 sequence를 맞춘다.
select setval(
  pg_get_serial_sequence('public.character_types', 'id'),
  (select max(id) from public.character_types),
  true
);
select setval(
  pg_get_serial_sequence('public.character_type_stages', 'id'),
  (select max(id) from public.character_type_stages),
  true
);
select setval(
  pg_get_serial_sequence('public.question_categories', 'id'),
  (select max(id) from public.question_categories),
  true
);
select setval(
  pg_get_serial_sequence('public.questions', 'id'),
  (select max(id) from public.questions),
  true
);
select setval(
  pg_get_serial_sequence('public.question_choices', 'id'),
  (select max(id) from public.question_choices),
  true
);
select setval(
  pg_get_serial_sequence('public.item_categories', 'id'),
  (select max(id) from public.item_categories),
  true
);
select setval(
  pg_get_serial_sequence('public.shop_items', 'id'),
  (select max(id) from public.shop_items),
  true
);

commit;
