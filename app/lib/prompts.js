export function buildFinalPrompt({
  gender = "student",
  outfitType = "suit",
  suitColor = "navy",
  shirtColor = "white",
  backgroundColor = "cool-gray",
  expression = "calm",
}) {
  const genderText =
    gender === "female"
      ? "female student or young woman"
      : gender === "male"
      ? "male student or young man"
      : "student";

  const expressionText =
    expression === "smile"
      ? "a gentle, natural, confident smile"
      : "a calm, relaxed, confident expression with a very subtle smile";

  const suitMap = {
    black: "deep black tailored suit",
    navy: "deep navy tailored suit",
    gray: "charcoal gray tailored suit",
  };

  const shirtMap = {
    white: "pure white dress shirt",
    blue: "light blue dress shirt",
    navy: "deep navy shirt",
    black: "black shirt",
  };

  const backgroundMap = {
    white: "clean white studio background",
    "cool-gray":
      "neutral pale cool-gray studio background with a very subtle blue-gray tone",
    bluegray:
      "very pale desaturated blue-gray studio background",
  };

  const suit = suitMap[suitColor] || suitMap.navy;
  const shirt = shirtMap[shirtColor] || shirtMap.white;
  const background =
    backgroundMap[backgroundColor] || backgroundMap["cool-gray"];

  let clothingPrompt = "";

  if (outfitType === "suit") {
    clothingPrompt = `
CLOTHING:
- ${suit}
- pure white dress shirt
- solid deep navy silk tie
- perfectly centered clean tie knot
- symmetrical shirt collar
- structured shoulders
- clean tailored lapels
- no wrinkles
- no striped tie
- no patterned tie
`;
  } else if (outfitType === "shirt") {
    clothingPrompt = `
CLOTHING:
- ${shirt}
- clean structured collar
- neat professional fit
- no wrinkles
- simple and refined appearance
`;
  } else if (outfitType === "knit") {
    clothingPrompt = `
CLOTHING:
- clean premium knitwear
- simple solid color
- neat neckline
- refined student portrait styling
- no distracting patterns
`;
  } else if (outfitType === "blouse") {
    clothingPrompt = `
CLOTHING:
- elegant clean blouse
- refined simple silhouette
- neat neckline
- premium portrait-studio styling
- no distracting patterns
`;
  } else if (outfitType === "cardigan") {
    clothingPrompt = `
CLOTHING:
- neat premium cardigan over a clean inner shirt or blouse
- simple solid-color styling
- tidy professional appearance
`;
  } else {
    clothingPrompt = `
CLOTHING:
- clean and polished student portrait clothing
- simple, premium, professional styling
`;
  }

  return `
Use ALL uploaded reference photos as identity references for the SAME PERSON.

Create a dramatically refined, high-end Korean portrait-studio ID photograph of this ${genderText}.

IMPORTANT GOAL:
The final result must look substantially more polished, groomed, photogenic and professionally photographed than the source images.
The before-and-after improvement should be immediately visible.

IDENTITY:
- The result must remain clearly recognizable as the same person.
- Preserve the person's distinctive identity and recognizable facial characteristics.
- Preserve the overall relationship between the eyes, nose, mouth, ears and facial proportions.
- However, do NOT rigidly preserve every temporary asymmetry, awkward expression, camera distortion, poor posture, messy hairstyle, uneven lighting or unflattering photographic artifact from the input.
- Identity preservation must NOT be interpreted as minimal retouching.

RETUCHING INTENSITY:
Apply STRONG high-end commercial portrait retouching.

Target the visual quality of:
- a premium Korean portrait studio
- professionally retouched employment photography
- an actor or agency profile portrait
- high-end beauty retouching

Do not produce a minimally corrected passport photo.

FACE AND POSE:
- Correct awkward head angle and posture.
- Create a perfectly centered front-facing portrait.
- Align the eyes naturally toward the camera.
- Keep the face symmetrical and visually balanced where appropriate.
- Improve the visual definition of the jawline through lighting and retouching.
- Refine cheek and facial contour transitions.
- Keep the person recognizable.

EXPRESSION:
- Create ${expressionText}.
- Remove tense or awkward mouth posture.
- Make the eyes look naturally engaged and alert.

SKIN RETOUCHING:
Apply professional frequency-separation-style retouching.

- strongly reduce blemishes
- strongly reduce redness
- remove uneven skin coloration
- reduce visible pores while keeping fine realistic skin texture
- reduce dark circles by approximately 60–75%
- soften under-eye grooves
- soften nasolabial shadows
- reduce dull gray coloration around the mouth
- reduce beard shadow where present
- smooth forehead and cheek tonal irregularities
- brighten the central face
- retain realistic skin texture
- avoid waxy or plastic skin

DODGE AND BURN:
Apply detailed professional dodge-and-burn.

- soft highlight on center forehead
- clean narrow highlight along nose bridge
- subtle highlight on upper cheekbones
- brighten the under-eye triangle
- subtle shadow beneath cheekbones
- controlled shadow beneath jawline
- slightly darken the outer facial perimeter
- create more refined facial dimensionality

The face should appear more sculpted and photogenic through lighting and retouching, not through obvious cosmetic surgery.

EYES:
- Preserve recognizable eye shape.
- Improve clarity and brightness.
- Add small natural studio catchlights.
- increase iris definition
- reduce redness in the whites of the eyes
- reduce dullness
- make eye contact with the camera clear
- do not create unnaturally enlarged eyes

EYEBROWS:
- clean and refine stray hairs
- improve definition
- preserve natural eyebrow shape

HAIR:
- preserve the natural hairline and hair color
- professionally restyle the hair
- remove stray hairs and flyaways
- improve fringe direction
- improve crown volume
- refine side silhouette
- add clean strand separation
- add subtle healthy shine
- make the hairstyle look intentionally prepared before a professional studio portrait
- do not merely preserve messy source hair

${clothingPrompt}

LIGHTING:
Use premium Korean portrait-studio beauty lighting.

- large soft key light slightly above camera level
- soft frontal fill light
- subtle rim light separating hair from background
- bright clean facial center
- controlled dimensional shadows
- clean highlights on forehead, nose and cheeks
- avoid flat passport lighting
- avoid harsh contrast

BACKGROUND:
- ${background}
- smooth seamless studio background
- low saturation
- subtle radial brightness behind the head
- no objects
- no scenery
- no text
- no patterns
- not bright sky blue

COMPOSITION:
- vertical 3:4 professional ID portrait
- perfectly front-facing
- eyes level with camera
- head centered
- shoulders visible
- balanced headroom
- stable symmetrical composition

IMAGE QUALITY:
- extremely polished professional photography
- high-end retouched commercial portrait
- realistic photographic detail
- sharp eyes, eyebrows and hair
- refined skin
- premium studio finish
- no obvious AI artifacts
- no excessive HDR
- no cartoon-like appearance

FINAL PRIORITY:
Prioritize a visibly dramatic improvement in grooming, lighting, skin, hair, posture, expression and overall photographic quality.

The final result should feel like this person visited a premium Korean portrait studio, received professional grooming, hair styling, wardrobe preparation, beauty lighting and extensive manual Photoshop retouching.

The result must still be recognizable as the same person, but it should NOT look like only a lightly edited version of the original photograph.
`;
}
