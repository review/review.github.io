port module Main exposing (main)

import Browser
import Browser.Events
import Element as E
import Element.Background as Background
import Element.Border as Border
import Element.Events as Events
import Element.Font as Font
import Element.Input as Input
import File exposing (File)
import File.Select as Select
import Html exposing (Html)
import Html.Attributes
import Html.Events
import Http
import Icons
import Json.Decode as Decode
import Json.Encode as Encode
import Round
import Task
import Url.Builder



-- ██   ██ ███████ ██      ██████  ███████ ██████  ███████
-- ██   ██ ██      ██      ██   ██ ██      ██   ██ ██
-- ███████ █████   ██      ██████  █████   ██████  ███████
-- ██   ██ ██      ██      ██      ██      ██   ██      ██
-- ██   ██ ███████ ███████ ██      ███████ ██   ██ ███████


ternary : Bool -> a -> a -> a
ternary bool one two =
    if bool then
        one

    else
        two


type DataUrl
    = Valid String
    | Invalid String
    | NoUrl


processUrl : String -> DataUrl
processUrl url =
    if String.isEmpty url then
        NoUrl

    else if String.startsWith "gh:" url then
        let
            ghurl =
                String.dropLeft 3 url

            ghparts =
                String.split "/" ghurl
        in
        if List.length ghparts >= 4 then
            Valid <| Url.Builder.crossOrigin "https://raw.githubusercontent.com" ghparts []

        else
            Invalid "Invalid gh query, try 'gh:username/repo/branch/filepath'."

    else
        Valid url


getFile : String -> Cmd Msg
getFile url =
    Http.get
        { url = url
        , expect = Http.expectString HttpGotFile
        }


timeJump : Float -> Float
timeJump duration =
    duration / 10


speedLimit : Float
speedLimit =
    5


keyDecoder : Model -> Decode.Decoder Msg
keyDecoder model =
    Decode.map (handleKey model) (Decode.field "key" Decode.string)


handleKey : Model -> String -> Msg
handleKey model str =
    case str of
        " " ->
            TogglePlayback

        "ArrowRight" ->
            ChangeTime (min model.timeEnd (model.time + timeJump model.timeEnd))

        "ArrowLeft" ->
            ChangeTime (max 0 (model.time - timeJump model.timeEnd))

        "ArrowUp" ->
            ChangeSpeed (min speedLimit (model.speed + 1))

        "ArrowDown" ->
            ChangeSpeed (max -speedLimit (model.speed - 1))

        _ ->
            NoOp



--  ██████  ██████  ███    ██ ███████ ████████  █████  ███    ██ ████████ ███████
-- ██      ██    ██ ████   ██ ██         ██    ██   ██ ████   ██    ██    ██
-- ██      ██    ██ ██ ██  ██ ███████    ██    ███████ ██ ██  ██    ██    ███████
-- ██      ██    ██ ██  ██ ██      ██    ██    ██   ██ ██  ██ ██    ██         ██
--  ██████  ██████  ██   ████ ███████    ██    ██   ██ ██   ████    ██    ███████


logPrefix : String
logPrefix =
    "?log=https://raw.githubusercontent.com/review/review.github.io/master/examples/"


filePrefix : String
filePrefix =
    "https://github.com/review/review.github.io/tree/master/examples/"


uiWidth : E.Length
uiWidth =
    E.fill |> E.maximum 800


uiHeight : E.Length
uiHeight =
    E.px 40


uiRoundness : Int
uiRoundness =
    5


uiFontSize : Int
uiFontSize =
    11


uiBGColor : E.Color
uiBGColor =
    E.rgba255 255 255 255 50


uiAccentColor : E.Color
uiAccentColor =
    E.rgb255 5 125 176


uiPrimaryColor : E.Color
uiPrimaryColor =
    E.rgb255 30 30 30


uiDisabledColor : E.Color
uiDisabledColor =
    E.rgb255 200 200 200


uiErrorColor : E.Color
uiErrorColor =
    E.rgb255 255 0 0


uiHoverStyle : E.Attribute msg
uiHoverStyle =
    E.mouseOver
        [ Border.shadow
            { offset = ( 0, 3 )
            , size = 0
            , blur = 3
            , color = E.rgba255 0 0 0 0.2
            }
        ]


uiSpinStyle : E.Attribute msg
uiSpinStyle =
    E.htmlAttribute <|
        Html.Attributes.style "animation" "spin 4s linear infinite"


uiToolTip : String -> E.Attribute msg
uiToolTip tip =
    E.htmlAttribute <| Html.Attributes.title tip


buttonWidth : E.Length
buttonWidth =
    uiHeight


sliderWidth : E.Length
sliderWidth =
    E.fill |> E.minimum 100



-- ███    ███  █████  ██ ███    ██
-- ████  ████ ██   ██ ██ ████   ██
-- ██ ████ ██ ███████ ██ ██ ██  ██
-- ██  ██  ██ ██   ██ ██ ██  ██ ██
-- ██      ██ ██   ██ ██ ██   ████


main : Program String Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }



-- ███    ███ ███████ ███████ ███████  █████   ██████  ███████ ███████
-- ████  ████ ██      ██      ██      ██   ██ ██       ██      ██
-- ██ ████ ██ █████   ███████ ███████ ███████ ██   ███ █████   ███████
-- ██  ██  ██ ██           ██      ██ ██   ██ ██    ██ ██           ██
-- ██      ██ ███████ ███████ ███████ ██   ██  ██████  ███████ ███████


type Msg
    = NoOp
    | Kill
    | StartScrubbing
    | EndScrubbing
    | TogglePlayback
    | ChangeTime Time
    | ToggleLooping
    | ChangeSpeed SpeedFactor
    | ToggleFollowing
    | CameraReset
    | ToggleColorful
    | Download
    | UpdateUrlText String
    | UrlEnterKeyPress
    | HttpGotFile (Result Http.Error String)
    | FilePick
    | FileDragEnter
    | FileDragLeave
    | ReceivedFiles File (List File)
    | FileLoaded String
    | VisualizationLoaded Float
    | VisualizationTime Float
    | VisualizationCommand String
    | HandleError String



-- ███████ ██    ██ ██████  ███████  ██████ ██████  ██ ██████  ████████ ██  ██████  ███    ██ ███████
-- ██      ██    ██ ██   ██ ██      ██      ██   ██ ██ ██   ██    ██    ██ ██    ██ ████   ██ ██
-- ███████ ██    ██ ██████  ███████ ██      ██████  ██ ██████     ██    ██ ██    ██ ██ ██  ██ ███████
--      ██ ██    ██ ██   ██      ██ ██      ██   ██ ██ ██         ██    ██ ██    ██ ██  ██ ██      ██
-- ███████  ██████  ██████  ███████  ██████ ██   ██ ██ ██         ██    ██  ██████  ██   ████ ███████


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ vis2UiLoaded VisualizationLoaded
        , vis2UiTime VisualizationTime
        , vis2UiCommand VisualizationCommand
        , vis2UiError HandleError
        , Browser.Events.onKeyDown (keyDecoder model)
        ]



-- ██████   ██████  ██████  ████████ ███████
-- ██   ██ ██    ██ ██   ██    ██    ██
-- ██████  ██    ██ ██████     ██    ███████
-- ██      ██    ██ ██   ██    ██         ██
-- ██       ██████  ██   ██    ██    ███████


port ui2VisCommand : Encode.Value -> Cmd msg


port ui2VisTime : Encode.Value -> Cmd msg


port ui2VisSpeed : Encode.Value -> Cmd msg


port ui2VisData : Encode.Value -> Cmd msg


port vis2UiLoaded : (Float -> msg) -> Sub msg


port vis2UiTime : (Float -> msg) -> Sub msg


port vis2UiCommand : (String -> msg) -> Sub msg


port vis2UiError : (String -> msg) -> Sub msg



-- ███    ███  ██████  ██████  ███████ ██
-- ████  ████ ██    ██ ██   ██ ██      ██
-- ██ ████ ██ ██    ██ ██   ██ █████   ██
-- ██  ██  ██ ██    ██ ██   ██ ██      ██
-- ██      ██  ██████  ██████  ███████ ███████


type ReviewStatus
    = Splash
    | Loading
    | Ready


type alias Time =
    Float


type alias SpeedFactor =
    Float


type alias Example =
    { description : String
    , filename : String
    }


type alias Model =
    { status : ReviewStatus
    , error : String
    , scrubbing : Bool
    , wasPaused : Bool
    , playing : Bool
    , looping : Bool
    , following : Bool
    , colorful : Bool
    , time : Time
    , timeEnd : Time
    , speed : SpeedFactor
    , urlText : String
    , fileHover : Bool
    , examples : List Example
    }



-- ██ ███    ██ ██ ████████
-- ██ ████   ██ ██    ██
-- ██ ██ ██  ██ ██    ██
-- ██ ██  ██ ██ ██    ██
-- ██ ██   ████ ██    ██


init : String -> ( Model, Cmd Msg )
init urlQuery =
    let
        ( error, cmd, status ) =
            case processUrl urlQuery of
                NoUrl ->
                    ( "", ui2VisCommand <| Encode.string "reset", Splash )

                Invalid err ->
                    ( err, Cmd.none, Splash )

                Valid processedUrl ->
                    ( "", getFile processedUrl, Loading )

        -- urlPresent =
        --     not (String.isEmpty urlQuery)
        -- errorMsg =
        --     if urlPresent && not (String.endsWith ".json" urlQuery) then
        --         "URL 'log' parameter does not point to a JSON file."
        --     else
        --         ""
        -- shouldGet =
        --     urlPresent && String.isEmpty errorMsg
    in
    ( { status = status
      , error = error
      , scrubbing = False
      , wasPaused = True
      , playing = False
      , looping = False
      , following = False
      , colorful = True
      , time = 0
      , timeEnd = 0
      , speed = 0
      , urlText = urlQuery
      , fileHover = False
      , examples =
            [ { description = "Simple Sphere", filename = "simple-sphere.json" }
            , { description = "Tumbling Worm", filename = "worm-tumble.json" }
            , { description = "Multiple Shapes", filename = "multiple-shapes.json" }
            , { description = "Galloping Quadruped", filename = "quadruped-gallop.json" }
            , { description = "Hopping Quadruped", filename = "quadruped-hop.json" }
            , { description = "Hopping Worm", filename = "worm-hop.json" }
            , { description = "Autonomous Vehicle", filename = "autonomous-vehicle.json" }
            ]
      }
    , cmd
    )



-- ██    ██ ██ ███████ ██     ██
-- ██    ██ ██ ██      ██     ██
-- ██    ██ ██ █████   ██  █  ██
--  ██  ██  ██ ██      ██ ███ ██
--   ████   ██ ███████  ███ ███


type ButtonStatus
    = Enabled
    | Active
    | Disabled


labelAttributes : E.Color -> List (E.Attribute msg)
labelAttributes clr =
    [ E.centerY
    , E.centerX
    , Font.color clr
    , Font.size uiFontSize
    ]


buttonAttributes : String -> List (E.Attribute msg)
buttonAttributes tip =
    [ E.width buttonWidth
    , E.height uiHeight
    , uiToolTip tip
    ]


icon : Html msg -> E.Color -> E.Element msg
icon ico clr =
    E.el (labelAttributes clr)
        (E.html ico)


iconWithSpin : Html msg -> E.Color -> E.Element msg
iconWithSpin ico clr =
    E.el (uiSpinStyle :: labelAttributes clr)
        (E.html ico)


text : String -> E.Color -> E.Element msg
text str clr =
    E.el (labelAttributes clr)
        (E.text str)


button : (E.Color -> E.Element Msg) -> ButtonStatus -> Msg -> String -> E.Element Msg
button lbl sts msg tip =
    let
        buttonColor =
            case sts of
                Enabled ->
                    uiPrimaryColor

                Active ->
                    uiAccentColor

                Disabled ->
                    uiDisabledColor

        attrs =
            buttonAttributes tip
    in
    if sts == Disabled then
        E.el attrs (lbl buttonColor)

    else
        Input.button
            ([ uiHoverStyle, Border.rounded uiRoundness ] ++ attrs)
            { onPress = Just msg, label = lbl buttonColor }


thumb : Input.Thumb
thumb =
    Input.thumb
        [ E.width (E.px 12)
        , E.height uiHeight
        , Border.rounded uiRoundness
        , Border.width 1
        , Border.color (E.rgb255 200 200 200)
        ]


slider : Input.Label Msg -> Float -> Float -> Float -> Maybe Float -> (Float -> Msg) -> Msg -> Msg -> E.Element Msg
slider lbl min max val stp msgUpdate msgScrubDown msgScrubUp =
    E.el
        [ E.width sliderWidth
        , Events.onMouseDown msgScrubDown
        , Events.onMouseUp msgScrubUp
        ]
    <|
        Input.slider
            [ E.height uiHeight
            , E.behindContent <|
                -- Track
                E.el
                    [ E.width E.fill
                    , E.height E.fill
                    , E.centerY
                    , Background.color (E.rgba255 225 225 225 0.3)
                    , Border.rounded uiRoundness
                    ]
                    E.none
            ]
            { label = lbl
            , max = max
            , min = min
            , onChange = msgUpdate
            , step = stp
            , thumb = thumb
            , value = val
            }


onEnterKey : msg -> E.Attribute msg
onEnterKey msg =
    E.htmlAttribute
        (Html.Events.on "keyup"
            (Decode.field "key" Decode.string
                |> Decode.andThen
                    (\key ->
                        if key == "Enter" then
                            Decode.succeed msg

                        else
                            Decode.fail "Not the enter key"
                    )
            )
        )


overrideOn : String -> Decode.Decoder msg -> E.Attribute msg
overrideOn event decoder =
    E.htmlAttribute <| Html.Events.preventDefaultOn event (Decode.map override decoder)


override : msg -> ( msg, Bool )
override msg =
    ( msg, True )


handleFileDrop : Decode.Decoder Msg
handleFileDrop =
    Decode.at [ "dataTransfer", "files" ] (Decode.oneOrMore ReceivedFiles File.decoder)


view : Model -> Html Msg
view model =
    let
        isError =
            not (String.isEmpty model.error)

        playerReady =
            case model.status of
                Ready ->
                    Enabled

                _ ->
                    Disabled

        btnStatus state =
            case ( model.status, state ) of
                ( Ready, True ) ->
                    Active

                ( Ready, False ) ->
                    Enabled

                _ ->
                    Disabled

        cameraBtnStatus =
            if model.status /= Ready || model.following then
                Disabled

            else
                Enabled

        scrubberLabel =
            Input.labelLeft [] (button (text (Round.round 2 model.time)) playerReady (ChangeTime 0) "Set time to beginning.")

        speedLabel =
            Input.labelRight [] (button (text ("x " ++ Round.round 2 model.speed)) playerReady (ChangeSpeed 1) "Set speed to x1.")

        spdBound =
            case model.status of
                Ready ->
                    speedLimit

                _ ->
                    0

        playPauseIcon =
            ternary model.playing (icon Icons.pause) (icon Icons.play)

        ( newDeleteIcon, newDeleteTip, newDeleteStatus ) =
            case model.status of
                Splash ->
                    ( icon Icons.filePlus, "Load a new visualization.", Active )

                Loading ->
                    ( iconWithSpin Icons.loader, "Loading visualization.", Disabled )

                Ready ->
                    ( icon Icons.trash2, "Delete the current visualization.", Enabled )

        player =
            E.wrappedRow
                [ E.width uiWidth
                , Background.color (E.rgba255 255 255 255 0.4)
                , Border.rounded uiRoundness
                , uiHoverStyle
                ]
                [ button newDeleteIcon newDeleteStatus Kill newDeleteTip
                , button playPauseIcon playerReady TogglePlayback "Play/Pause."
                , slider scrubberLabel 0 model.timeEnd model.time Nothing (\new -> ChangeTime new) StartScrubbing EndScrubbing
                , button (text (Round.round 2 model.timeEnd)) playerReady (ChangeTime model.timeEnd) "Set time to end."
                , button (icon Icons.repeat) (btnStatus model.looping) ToggleLooping "Loop playback."
                , slider speedLabel -spdBound spdBound model.speed (Just 0.2) (\new -> ChangeSpeed new) NoOp NoOp
                , button (icon Icons.crosshair) (btnStatus model.following) ToggleFollowing "Follow model."
                , button (icon Icons.video) cameraBtnStatus CameraReset "Reset camera."
                , button (icon Icons.eye) (btnStatus <| not model.colorful) ToggleColorful "Enable/Disable colors."
                , button (icon Icons.download) playerReady Download "Download GLTF."
                , E.newTabLink []
                    { url = "https://github.com/review/review.github.io"
                    , label = button (icon Icons.github) Enabled NoOp "View source code."
                    }
                ]

        startup =
            case model.status of
                Splash ->
                    E.column
                        [ Background.color uiBGColor
                        , Border.rounded uiRoundness
                        , Border.color <| ternary isError uiErrorColor uiDisabledColor
                        , Border.width 1
                        , E.width E.fill
                        , E.moveDown 20
                        , E.padding 20
                        , E.spacing 20
                        , uiHoverStyle
                        ]
                        [ E.el
                            [ E.centerX
                            , Font.color <| ternary isError uiErrorColor uiDisabledColor
                            ]
                            (E.text <| ternary isError model.error "Ready for visualization data.")
                        , Input.text
                            [ onEnterKey UrlEnterKeyPress
                            , Border.color uiPrimaryColor
                            , Border.rounded uiRoundness
                            , uiHoverStyle
                            ]
                            { label = Input.labelAbove [ E.centerX ] (E.text "Enter Visualization File URL")
                            , onChange = UpdateUrlText
                            , placeholder = Just (Input.placeholder [] (E.text "URL of visualization file..."))
                            , text = model.urlText
                            }
                        , E.el [ E.centerX ] (E.text "Or")
                        , E.column
                            [ Border.dashed
                            , Border.width 4
                            , Border.color <| ternary model.fileHover uiAccentColor uiDisabledColor
                            , E.height (E.px 256)
                            , E.width E.fill
                            , overrideOn "dragenter" (Decode.succeed FileDragEnter)
                            , overrideOn "dragover" (Decode.succeed FileDragEnter)
                            , overrideOn "dragleave" (Decode.succeed FileDragLeave)
                            , overrideOn "drop" handleFileDrop
                            ]
                            [ E.el [ E.centerX, E.padding 64 ] (E.text "Drag and Drop a File")
                            , Input.button
                                [ E.padding 10
                                , E.centerX
                                , Border.width 1
                                , Border.color uiPrimaryColor
                                , Border.rounded uiRoundness
                                , uiHoverStyle
                                ]
                                { onPress = Just FilePick
                                , label = E.text "Select Local Visualization File"
                                }
                            ]
                        , E.table [ Font.size 14 ]
                            { data = model.examples
                            , columns =
                                [ { header = E.el [ Font.bold ] (E.text "Demo")
                                  , width = E.fill
                                  , view =
                                        \person ->
                                            E.link [ uiHoverStyle, E.padding 5, E.centerX ]
                                                { url = logPrefix ++ person.filename
                                                , label = E.text person.description
                                                }
                                  }
                                , { header = E.el [ Font.bold ] (E.text "File")
                                  , width = E.fill
                                  , view =
                                        \person ->
                                            E.newTabLink [ uiHoverStyle, E.padding 5 ]
                                                { url = filePrefix ++ person.filename
                                                , label = E.text ("View file: " ++ person.filename)
                                                }
                                  }
                                ]
                            }
                        ]

                _ ->
                    E.none
    in
    E.layout
        [ E.inFront
            (E.column
                [ E.width uiWidth
                , E.centerX
                ]
                [ player, startup ]
            )
        ]
        E.none



-- ██    ██ ██████  ██████   █████  ████████ ███████
-- ██    ██ ██   ██ ██   ██ ██   ██    ██    ██
-- ██    ██ ██████  ██   ██ ███████    ██    █████
-- ██    ██ ██      ██   ██ ██   ██    ██    ██
--  ██████  ██      ██████  ██   ██    ██    ███████


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )

        HandleError err ->
            ( { model | status = Splash, error = err }, Cmd.none )

        Kill ->
            init ""

        StartScrubbing ->
            ( { model | scrubbing = True, wasPaused = not model.playing }, ui2VisCommand <| Encode.string "pause" )

        EndScrubbing ->
            ( { model | scrubbing = False }, ternary model.wasPaused Cmd.none (ui2VisCommand <| Encode.string "play") )

        TogglePlayback ->
            let
                nearEnd =
                    abs (model.time - model.timeEnd) < 0.2

                nearStart =
                    abs model.time < 0.2

                forward =
                    model.speed >= 0

                ( toggledPlayback, toggledCmd ) =
                    ( not model.playing, ternary model.playing "pause" "play" )

                ( newTime, newPlaying, newCommands ) =
                    if not model.playing then
                        case ( nearEnd, nearStart, forward ) of
                            ( True, _, True ) ->
                                ( 0, True, Cmd.batch [ ui2VisCommand <| Encode.string "play", ui2VisTime <| Encode.float 0 ] )

                            ( _, True, False ) ->
                                ( model.timeEnd, True, Cmd.batch [ ui2VisCommand <| Encode.string "play", ui2VisTime <| Encode.float model.timeEnd ] )

                            _ ->
                                ( model.time, toggledPlayback, ui2VisCommand <| Encode.string toggledCmd )

                    else
                        ( model.time, toggledPlayback, ui2VisCommand <| Encode.string toggledCmd )
            in
            ( { model | playing = newPlaying, time = newTime }, newCommands )

        ChangeTime time ->
            ( { model | time = time }, ui2VisTime <| Encode.float time )

        ToggleLooping ->
            ( { model | looping = not model.looping }, ui2VisCommand <| Encode.string (ternary model.looping "noLoop" "loop") )

        ChangeSpeed speed ->
            ( { model | speed = speed }, ui2VisSpeed <| Encode.float speed )

        ToggleFollowing ->
            ( { model | following = not model.following }, ui2VisCommand <| Encode.string (ternary model.following "unFollow" "follow") )

        CameraReset ->
            ( model, ui2VisCommand <| Encode.string "resetCamera" )

        ToggleColorful ->
            ( { model | colorful = not model.colorful }, ui2VisCommand <| Encode.string (ternary model.colorful "noColor" "color") )

        Download ->
            ( model, ui2VisCommand <| Encode.string "downloadGltf" )

        UpdateUrlText txt ->
            ( { model | urlText = txt }, Cmd.none )

        UrlEnterKeyPress ->
            let
                ( error, cmd, status ) =
                    case processUrl model.urlText of
                        NoUrl ->
                            ( "", ui2VisCommand <| Encode.string "reset", Splash )

                        Invalid err ->
                            ( err, Cmd.none, Splash )

                        Valid processedUrl ->
                            ( "", getFile processedUrl, Loading )
            in
            ( { model | status = status, error = error }, cmd )

        HttpGotFile result ->
            case result of
                Ok str ->
                    ( model, ui2VisData <| Encode.string str )

                Err _ ->
                    ( { model | error = "Could not get file from url.", status = Splash }, Cmd.none )

        FilePick ->
            ( model, Select.files [ "application/json" ] ReceivedFiles )

        FileDragEnter ->
            ( { model | fileHover = True }, Cmd.none )

        FileDragLeave ->
            ( { model | fileHover = False }, Cmd.none )

        ReceivedFiles file files ->
            if List.length files == 0 then
                ( { model | fileHover = False, status = Loading }, Task.perform FileLoaded (File.toString file) )

            else
                ( { model | fileHover = False, error = "Uploading multiple files is not supported at this time." }, Cmd.none )

        FileLoaded str ->
            ( model, ui2VisData <| Encode.string str )

        VisualizationLoaded end ->
            ( { model | status = Ready, timeEnd = end, speed = 1.0 }, Cmd.none )

        VisualizationTime new ->
            ( { model | time = new }, Cmd.none )

        VisualizationCommand cmd ->
            if cmd == "pause" then
                ( { model | playing = False, time = model.timeEnd }, ui2VisTime <| Encode.float model.timeEnd )

            else
                ( model, Cmd.none )
