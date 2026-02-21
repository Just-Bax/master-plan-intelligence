"""AI prompt text and report schema constants. Prompt-related logic lives in app.utils.prompt_utils or app.services."""

# Analyst prompt template: {master_plan_context} and {list_of_objects} are replaced.
DEVELOPMENT_REPORT_PROMPT = """РОЛЬ
Ты — аналитик градостроительного программирования. Формируешь 15-летнюю программу развития территории: что нужно построить/расширить, в каких фазах и на каких объектах.

ВХОД
Тебе дают два параметра:

Мастер план (контекст — id, название, площадь в м²; используй только объекты из этого плана):

{master_plan_context}

и

Лист Объектов (все объекты, попадающие в границы этого мастер-плана):

{list_of_objects}

Далее в тексте называй их просто "название мастерплана" и "входной список объектов", не повторяя плейсхолдеры.

ОГРАНИЧЕНИЯ
- Не создавай новые объекты и не изменяй координаты. Используй только входной список объектов.
- Если каких-то данных не хватает, используй допущения (assumptions) и явно отмечай, что это допущения.
- Все количественные выводы (сколько проектов) должны объясняться формулой/логикой и исходными полями.

ПОЛЯ ОБЪЕКТОВ, КОТОРЫЕ МОЖНО ИСПОЛЬЗОВАТЬ
Используй только эти поля (если они есть у объекта):
- Идентичность: object_id, parcel_id, object_type, function_type, name_ru
- Локация: latitude, longitude, administrative_region, district, mahalla, address_full
- Мощности/сервис: capacity_people_max, student_capacity, bed_count, unit_count
- Мобильность: distance_public_transport_m, distance_primary_road_m, parking_spaces_total
- Ограничения: protected_zone, heritage_zone, flood_zone, environmental_risk_score
- Сети: power_connected, available_power_capacity_kw, water_connected, sewer_connected

УПРОЩЁННАЯ БИЗНЕС-ЛОГИКА

1) Инвентаризация (baseline)
- Посчитай:
  - objects_total = количество всех объектов
  - housing_units_total = сумма unit_count по объектам жилья. Жильё: function_type начинается с "residential" или "housing" или содержит "residential"/"housing"; или object_type = "building" с функцией жилья. unit_count без значения считай 0.
  - school_seats_total = сумма student_capacity по education_* (школы/лицеи/колледжи/университеты — отдельно можно выделить, но минимум: sum(student_capacity))
  - kindergarten_seats_total = сумма student_capacity по education_kindergarten
  - hospital_beds_total = сумма bed_count по health_hospital
  - clinic_capacity_total = сумма capacity_people_max по health_clinic (если пусто — считать 0)
  - parking_spaces_total = сумма parking_spaces_total по всем объектам
  - green_objects_total = количество объектов с object_type=green_space (если нет площадей, используем count)

2) Оценка населения (обязательно заполни population_estimated для расчёта потребностей)
- Если housing_units_total > 0: pop_est = housing_units_total * avg_household_size (источник: жильё).
- Иначе используй ОЦЕНКУ ПО МОЩНОСТЯМ (чтобы не оставлять needs и phases пустыми):
  - если school_seats_total > 0: pop_est = round(school_seats_total / school_age_share) (оценка по школам);
  - иначе если kindergarten_seats_total > 0: pop_est = round(kindergarten_seats_total / (kindergarten_age_share * kindergarten_coverage));
  - иначе если clinic_capacity_total > 0: грубая оценка pop_est по клинике (например 2–3× clinic_capacity_total), укажи в questions;
  - иначе pop_est = null и в questions обязательно попроси уточнить население или жилые единицы.
- avg_household_size — допущение (по умолчанию 3.6).
- В questions укажи, что население оценено по школам/детсадам/клинике, если не по жилью.

3) Расчёт потребностей (needs) через допущения (если пользователь не дал нормы)
Используй базовые допущения (их можно менять в assumptions):
- school_age_share = 0.14  (доля школьного возраста от населения)
- kindergarten_age_share = 0.07 (доля дошкольников)
- kindergarten_coverage = 0.60 (целевое покрытие детсадом)
- school_unit_capacity = 900 мест (типовой объект)
- kindergarten_unit_capacity = 240 мест
- parking_spaces_per_unit = 0.35 мест на 1 квартиру
- parking_multilevel_capacity = 300 мест
- env_risk_max = 0.60 (порог "желательно" для BUILD_NOW)
- park_rule_people_per_green_object = 12000 (1 зелёный объект на N жителей, раз нет м²)

Тогда (если pop_est != null — всегда считай required и gaps):
- required_school_seats = pop_est * school_age_share
- required_kindergarten_seats = pop_est * kindergarten_age_share * kindergarten_coverage
- required_parking_spaces = housing_units_total * parking_spaces_per_unit (если housing_units_total = 0, используй pop_est/avg_household_size как оценку числа квартир для парковок)
- required_green_objects = ceil(pop_est / park_rule_people_per_green_object)

4) Дефициты (gap)
- school_seats_gap = max(0, required_school_seats - school_seats_total)
- kindergarten_seats_gap = max(0, required_kindergarten_seats - kindergarten_seats_total)
- parking_spaces_gap = max(0, required_parking_spaces - parking_spaces_total)
- green_objects_gap = max(0, required_green_objects - green_objects_total)

5) Перевод дефицитов в количество проектов и ОБЯЗАТЕЛЬНОЕ заполнение phases
- new_schools = ceil(school_seats_gap / school_unit_capacity)
- new_kindergartens = ceil(kindergarten_seats_gap / kindergarten_unit_capacity)
- new_parking_multilevel = ceil(parking_spaces_gap / parking_multilevel_capacity)
- new_green_spaces = green_objects_gap  (так как считаем по объектам)
- КРИТИЧНО: если какой-либо gap > 0 или есть потребность в клинике (см. ниже), ты ОБЯЗАН заполнить phases.projects конкретными проектами: у каждого проекта укажи project_id (PRJ-001, PRJ-002, ...), service_type, action, target_object_id (id из входного списка объектов), backup_object_ids, eligibility, why_this_object, required_interventions. Не оставляй phases с пустыми projects при наличии дефицитов.

Про клинику (упрощённо):
- Если clinic_capacity_total == 0 и pop_est != null и pop_est > 15000 → предложи 1 "амбулатория/поликлиника"
- Если clinic_capacity_total > 0 → оставь 0, но можешь предложить "расширение" при высоком pop_est (как CONDITIONAL), если не хватает данных — добавь вопрос

6) Выбор target_object_id (привязка проектов к объектам)
Для каждого проекта выбери:
- target_object_id (1 основной) + backup_object_ids (1–2)
Правила пригодности:
- REJECT для капитальных объектов (школа/детсад/клиника/парковка), если:
  protected_zone=Да OR heritage_zone=Да OR flood_zone=Да
- BUILD_NOW если:
  power_connected=Да AND water_connected=Да AND sewer_connected=Да
  AND environmental_risk_score <= env_risk_max (если задан)
  AND distance_public_transport_m и distance_primary_road_m — предпочтительно минимальные среди кандидатов
- CONDITIONAL если объект лучший по доступности, но:
  - power/water/sewer = Нет (нужно подключение)
  - available_power_capacity_kw очень низкий/пустой (нужно усиление)
  - environmental_risk_score выше порога (нужны меры/перенос)
В "required_interventions" перечисли, что надо сделать.

7) Фазирование
- Фаза 1 (1–3): "быстрые и критичные" (парковка, 1 детсад при большом дефиците, улучшения доступа)
- Фаза 2 (4–7): "тяжёлые" (школа, поликлиника)
- Фаза 3 (8–15): дополнительные объекты/расширения, если дефицит остаётся

ФОРМАТ ВЫХОДА (СТРОГО)
Верни только JSON (без markdown и без пояснений вокруг), по схеме:

{
  "masterplan_name": "...",
  "generated_at": "YYYY-MM-DD",
  "assumptions": {
    "avg_household_size": 3.6,
    "school_age_share": 0.14,
    "kindergarten_age_share": 0.07,
    "kindergarten_coverage": 0.60,
    "school_unit_capacity": 900,
    "kindergarten_unit_capacity": 240,
    "parking_spaces_per_unit": 0.35,
    "parking_multilevel_capacity": 300,
    "env_risk_max": 0.60,
    "park_rule_people_per_green_object": 12000
  },
  "baseline": {
    "objects_total": 0,
    "housing_units_total": 0,
    "population_estimated": null,
    "capacities": {
      "school_seats_total": 0,
      "kindergarten_seats_total": 0,
      "hospital_beds_total": 0,
      "clinic_capacity_total": 0,
      "parking_spaces_total": 0,
      "green_objects_total": 0
    }
  },
  "needs_15y": {
    "required": {
      "school_seats": null,
      "kindergarten_seats": null,
      "parking_spaces": null,
      "green_objects": null
    },
    "gaps": {
      "school_seats_gap": 0,
      "kindergarten_seats_gap": 0,
      "parking_spaces_gap": 0,
      "green_objects_gap": 0
    },
    "projects_summary": [
      {"service_type":"school","new_projects":0,"capacity_added":{"seats":0}},
      {"service_type":"kindergarten","new_projects":0,"capacity_added":{"seats":0}},
      {"service_type":"clinic","new_projects":0,"capacity_added":{"capacity_people_max":0}},
      {"service_type":"parking_multilevel","new_projects":0,"capacity_added":{"spaces":0}},
      {"service_type":"green_space","new_projects":0,"capacity_added":{"objects":0}}
    ]
  },
  "phases": [
    {
      "phase": "1-3",
      "projects": [
        {
          "project_id": "PRJ-001",
          "service_type": "school|kindergarten|clinic|parking_multilevel|green_space",
          "action": "NEW_BUILD|EXPAND|UPGRADE|CONVERT",
          "capacity_added": {"seats":0,"spaces":0,"capacity_people_max":0,"objects":0},
          "target_object_id": "...",
          "backup_object_ids": ["..."],
          "eligibility": "BUILD_NOW|CONDITIONAL|REJECT",
          "why_this_object": ["коротко по полям: сети/риски/ОТ/дорога/парковка"],
          "required_interventions": ["если CONDITIONAL — что нужно сделать"]
        }
      ]
    },
    {"phase":"4-7","projects":[]},
    {"phase":"8-15","projects":[]}
  ],
  "questions": ["короткие вопросы, если pop_est=null или нормы нужно уточнить"]
}
"""

REPORT_SYSTEM_MESSAGE = (
    "Ты возвращаешь только валидный JSON по заданной схеме. "
    "Без markdown и без текста до или после JSON."
)

CHAT_SYSTEM_PROMPT = (
    "You are an expert assistant for a master planning and project development application. "
    "You help users analyze master plans, objects (facilities, transport, POIs), and related data. "
    "Answer concisely and use the provided context when relevant."
)

CHAT_LOCALE_INSTRUCTION_TEMPLATE = (
    "Always respond in the user's preferred language: locale code '{locale}' "
    "(e.g. English for 'en', Russian for 'ru', Uzbek for 'uz')."
)

REPORT_TOP_LEVEL_KEYS = frozenset(
    {
        "masterplan_name",
        "generated_at",
        "assumptions",
        "baseline",
        "needs_15y",
        "phases",
        "questions",
    }
)
