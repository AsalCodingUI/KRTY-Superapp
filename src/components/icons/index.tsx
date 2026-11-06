"use client"

/**
 * The app's icons: Untitled UI Icons (free line set, untitledui.com/icons;
 * free for personal and commercial use, not for redistribution as an icon
 * library). Import every icon from here, never from "@untitledui/icons"
 * directly, so the set stays one decision. Names keep the app's existing
 * (lucide-style) names; the right-hand side is the Untitled UI glyph. The
 * one glyph it lacks is drawn in ./custom.tsx. Stroke: STROKE, for all.
 * See docs/ui/icons.md.
 */

import * as React from "react"
import { STROKE } from "./custom"
import * as C from "./custom"

import { AlertCircle as UAlertCircle } from "@untitledui/icons/AlertCircle"
import { AlertOctagon as UAlertOctagon } from "@untitledui/icons/AlertOctagon"
import { AlertTriangle as UAlertTriangle } from "@untitledui/icons/AlertTriangle"
import { AlignCenter as UAlignCenter } from "@untitledui/icons/AlignCenter"
import { AlignLeft as UAlignLeft } from "@untitledui/icons/AlignLeft"
import { AlignRight as UAlignRight } from "@untitledui/icons/AlignRight"
import { AlignTopArrow01 as UAlignTopArrow01 } from "@untitledui/icons/AlignTopArrow01"
import { AlignTopArrow02 as UAlignTopArrow02 } from "@untitledui/icons/AlignTopArrow02"
import { Announcement01 as UAnnouncement01 } from "@untitledui/icons/Announcement01"
import { Archive as UArchive } from "@untitledui/icons/Archive"
import { ArrowDown as UArrowDown } from "@untitledui/icons/ArrowDown"
import { ArrowRight as UArrowRight } from "@untitledui/icons/ArrowRight"
import { ArrowUp as UArrowUp } from "@untitledui/icons/ArrowUp"
import { ArrowUpRight as UArrowUpRight } from "@untitledui/icons/ArrowUpRight"
import { AtSign as UAtSign } from "@untitledui/icons/AtSign"
import { BarChart01 as UBarChart01 } from "@untitledui/icons/BarChart01"
import { BarChart07 as UBarChart07 } from "@untitledui/icons/BarChart07"
import { Bold01 as UBold01 } from "@untitledui/icons/Bold01"
import { BookOpen01 as UBookOpen01 } from "@untitledui/icons/BookOpen01"
import { Briefcase01 as UBriefcase01 } from "@untitledui/icons/Briefcase01"
import { Briefcase02 as UBriefcase02 } from "@untitledui/icons/Briefcase02"
import { Browser as UBrowser } from "@untitledui/icons/Browser"
import { Building02 as UBuilding02 } from "@untitledui/icons/Building02"
import { Calculator as UCalculator } from "@untitledui/icons/Calculator"
import { Calendar as UCalendar } from "@untitledui/icons/Calendar"
import { CalendarCheck01 as UCalendarCheck01 } from "@untitledui/icons/CalendarCheck01"
import { CalendarDate as UCalendarDate } from "@untitledui/icons/CalendarDate"
import { CalendarMinus01 as UCalendarMinus01 } from "@untitledui/icons/CalendarMinus01"
import { CalendarMinus02 as UCalendarMinus02 } from "@untitledui/icons/CalendarMinus02"
import { CalendarPlus01 as UCalendarPlus01 } from "@untitledui/icons/CalendarPlus01"
import { Camera01 as UCamera01 } from "@untitledui/icons/Camera01"
import { CheckCircle as UCheckCircle } from "@untitledui/icons/CheckCircle"
import { CheckDone01 as UCheckDone01 } from "@untitledui/icons/CheckDone01"
import { CheckDone02 as UCheckDone02 } from "@untitledui/icons/CheckDone02"
import { CheckSquare as UCheckSquare } from "@untitledui/icons/CheckSquare"
import { CheckVerified01 as UCheckVerified01 } from "@untitledui/icons/CheckVerified01"
import { ChevronDown as UChevronDown } from "@untitledui/icons/ChevronDown"
import { ChevronLeft as UChevronLeft } from "@untitledui/icons/ChevronLeft"
import { ChevronLeftDouble as UChevronLeftDouble } from "@untitledui/icons/ChevronLeftDouble"
import { ChevronRightDouble as UChevronRightDouble } from "@untitledui/icons/ChevronRightDouble"
import { ChevronSelectorVertical as UChevronSelectorVertical } from "@untitledui/icons/ChevronSelectorVertical"
import { ChevronUp as UChevronUp } from "@untitledui/icons/ChevronUp"
import { ChevronUpDouble as UChevronUpDouble } from "@untitledui/icons/ChevronUpDouble"
import { Circle as UCircle } from "@untitledui/icons/Circle"
import { Clipboard as UClipboard } from "@untitledui/icons/Clipboard"
import { ClipboardCheck as UClipboardCheck } from "@untitledui/icons/ClipboardCheck"
import { ClockRefresh as UClockRefresh } from "@untitledui/icons/ClockRefresh"
import { Cloud01 as UCloud01 } from "@untitledui/icons/Cloud01"
import { CloudOff as UCloudOff } from "@untitledui/icons/CloudOff"
import { Code01 as UCode01 } from "@untitledui/icons/Code01"
import { Code02 as UCode02 } from "@untitledui/icons/Code02"
import { Columns02 as UColumns02 } from "@untitledui/icons/Columns02"
import { Columns03 as UColumns03 } from "@untitledui/icons/Columns03"
import { Copy04 as UCopy04 } from "@untitledui/icons/Copy04"
import { Copy06 as UCopy06 } from "@untitledui/icons/Copy06"
import { Copy07 as UCopy07 } from "@untitledui/icons/Copy07"
import { CornerDownLeft as UCornerDownLeft } from "@untitledui/icons/CornerDownLeft"
import { CornerDownRight as UCornerDownRight } from "@untitledui/icons/CornerDownRight"
import { CornerLeftUp as UCornerLeftUp } from "@untitledui/icons/CornerLeftUp"
import { CreditCard01 as UCreditCard01 } from "@untitledui/icons/CreditCard01"
import { CreditCard02 as UCreditCard02 } from "@untitledui/icons/CreditCard02"
import { CurrencyDollarCircle as UCurrencyDollarCircle } from "@untitledui/icons/CurrencyDollarCircle"
import { CursorClick01 as UCursorClick01 } from "@untitledui/icons/CursorClick01"
import { Dataflow03 as UDataflow03 } from "@untitledui/icons/Dataflow03"
import { Divider as UDivider } from "@untitledui/icons/Divider"
import { Dotpoints02 as UDotpoints02 } from "@untitledui/icons/Dotpoints02"
import { DotsHorizontal as UDotsHorizontal } from "@untitledui/icons/DotsHorizontal"
import { DotsVertical as UDotsVertical } from "@untitledui/icons/DotsVertical"
import { Download01 as UDownload01 } from "@untitledui/icons/Download01"
import { Edit04 as UEdit04 } from "@untitledui/icons/Edit04"
import { Edit05 as UEdit05 } from "@untitledui/icons/Edit05"
import { Eraser as UEraser } from "@untitledui/icons/Eraser"
import { Expand06 as UExpand06 } from "@untitledui/icons/Expand06"
import { Eye as UEye } from "@untitledui/icons/Eye"
import { EyeOff as UEyeOff } from "@untitledui/icons/EyeOff"
import { FaceSmile as UFaceSmile } from "@untitledui/icons/FaceSmile"
import { File03 as UFile03 } from "@untitledui/icons/File03"
import { File04 as UFile04 } from "@untitledui/icons/File04"
import { File05 as UFile05 } from "@untitledui/icons/File05"
import { File06 as UFile06 } from "@untitledui/icons/File06"
import { FilePlus02 as UFilePlus02 } from "@untitledui/icons/FilePlus02"
import { FilterLines as UFilterLines } from "@untitledui/icons/FilterLines"
import { Flag01 as UFlag01 } from "@untitledui/icons/Flag01"
import { FlipBackward as UFlipBackward } from "@untitledui/icons/FlipBackward"
import { FlipForward as UFlipForward } from "@untitledui/icons/FlipForward"
import { Folder as UFolder } from "@untitledui/icons/Folder"
import { FolderDownload as UFolderDownload } from "@untitledui/icons/FolderDownload"
import { FolderPlus as UFolderPlus } from "@untitledui/icons/FolderPlus"
import { GitBranch01 as UGitBranch01 } from "@untitledui/icons/GitBranch01"
import { Globe01 as UGlobe01 } from "@untitledui/icons/Globe01"
import { GoogleChrome as UGoogleChrome } from "@untitledui/icons/GoogleChrome"
import { Hash01 as UHash01 } from "@untitledui/icons/Hash01"
import { Heading01 as UHeading01 } from "@untitledui/icons/Heading01"
import { Heading02 as UHeading02 } from "@untitledui/icons/Heading02"
import { HeadingSquare as UHeadingSquare } from "@untitledui/icons/HeadingSquare"
import { Heart as UHeart } from "@untitledui/icons/Heart"
import { HelpCircle as UHelpCircle } from "@untitledui/icons/HelpCircle"
import { Image01 as UImage01 } from "@untitledui/icons/Image01"
import { Image04 as UImage04 } from "@untitledui/icons/Image04"
import { ImagePlus as UImagePlus } from "@untitledui/icons/ImagePlus"
import { ImageUp as UImageUp } from "@untitledui/icons/ImageUp"
import { Inbox01 as UInbox01 } from "@untitledui/icons/Inbox01"
import { Infinity as UInfinity } from "@untitledui/icons/Infinity"
import { InfoCircle as UInfoCircle } from "@untitledui/icons/InfoCircle"
import { Italic01 as UItalic01 } from "@untitledui/icons/Italic01"
import { LayersTwo01 as ULayersTwo01 } from "@untitledui/icons/LayersTwo01"
import { LayoutAlt01 as ULayoutAlt01 } from "@untitledui/icons/LayoutAlt01"
import { LayoutAlt04 as ULayoutAlt04 } from "@untitledui/icons/LayoutAlt04"
import { LayoutGrid01 as ULayoutGrid01 } from "@untitledui/icons/LayoutGrid01"
import { LayoutLeft as ULayoutLeft } from "@untitledui/icons/LayoutLeft"
import { LineChartUp01 as ULineChartUp01 } from "@untitledui/icons/LineChartUp01"
import { Link02 as ULink02 } from "@untitledui/icons/Link02"
import { LinkBroken01 as ULinkBroken01 } from "@untitledui/icons/LinkBroken01"
import { LinkExternal01 as ULinkExternal01 } from "@untitledui/icons/LinkExternal01"
import { List as UList } from "@untitledui/icons/List"
import { Loading01 as ULoading01 } from "@untitledui/icons/Loading01"
import { Loading02 as ULoading02 } from "@untitledui/icons/Loading02"
import { Lock01 as ULock01 } from "@untitledui/icons/Lock01"
import { LogIn01 as ULogIn01 } from "@untitledui/icons/LogIn01"
import { LogOut01 as ULogOut01 } from "@untitledui/icons/LogOut01"
import { MagicWand02 as UMagicWand02 } from "@untitledui/icons/MagicWand02"
import { Mail01 as UMail01 } from "@untitledui/icons/Mail01"
import { Mail03 as UMail03 } from "@untitledui/icons/Mail03"
import { MarkerPin01 as UMarkerPin01 } from "@untitledui/icons/MarkerPin01"
import { Maximize01 as UMaximize01 } from "@untitledui/icons/Maximize01"
import { Menu01 as UMenu01 } from "@untitledui/icons/Menu01"
import { MessageAlertSquare as UMessageAlertSquare } from "@untitledui/icons/MessageAlertSquare"
import { MessageCircle01 as UMessageCircle01 } from "@untitledui/icons/MessageCircle01"
import { MessageTextSquare01 as UMessageTextSquare01 } from "@untitledui/icons/MessageTextSquare01"
import { MessageTextSquare02 as UMessageTextSquare02 } from "@untitledui/icons/MessageTextSquare02"
import { Minimize02 as UMinimize02 } from "@untitledui/icons/Minimize02"
import { Minus as UMinus } from "@untitledui/icons/Minus"
import { Monitor01 as UMonitor01 } from "@untitledui/icons/Monitor01"
import { Moon01 as UMoon01 } from "@untitledui/icons/Moon01"
import { Palette as UPalette } from "@untitledui/icons/Palette"
import { Paperclip as UPaperclip } from "@untitledui/icons/Paperclip"
import { PauseCircle as UPauseCircle } from "@untitledui/icons/PauseCircle"
import { PenTool02 as UPenTool02 } from "@untitledui/icons/PenTool02"
import { Phone as UPhone } from "@untitledui/icons/Phone"
import { Phone01 as UPhone01 } from "@untitledui/icons/Phone01"
import { PieChart01 as UPieChart01 } from "@untitledui/icons/PieChart01"
import { Pilcrow01 as UPilcrow01 } from "@untitledui/icons/Pilcrow01"
import { Pin01 as UPin01 } from "@untitledui/icons/Pin01"
import { Placeholder as UPlaceholder } from "@untitledui/icons/Placeholder"
import { Play as UPlay } from "@untitledui/icons/Play"
import { Plus as UPlus } from "@untitledui/icons/Plus"
import { Podcast as UPodcast } from "@untitledui/icons/Podcast"
import { Power01 as UPower01 } from "@untitledui/icons/Power01"
import { Printer as UPrinter } from "@untitledui/icons/Printer"
import { Recording01 as URecording01 } from "@untitledui/icons/Recording01"
import { RefreshCcw01 as URefreshCcw01 } from "@untitledui/icons/RefreshCcw01"
import { RefreshCw01 as URefreshCw01 } from "@untitledui/icons/RefreshCw01"
import { Repeat01 as URepeat01 } from "@untitledui/icons/Repeat01"
import { Rocket01 as URocket01 } from "@untitledui/icons/Rocket01"
import { Rows02 as URows02 } from "@untitledui/icons/Rows02"
import { Ruler as URuler } from "@untitledui/icons/Ruler"
import { Save01 as USave01 } from "@untitledui/icons/Save01"
import { Scissors01 as UScissors01 } from "@untitledui/icons/Scissors01"
import { SearchRefraction as USearchRefraction } from "@untitledui/icons/SearchRefraction"
import { Send01 as USend01 } from "@untitledui/icons/Send01"
import { Settings02 as USettings02 } from "@untitledui/icons/Settings02"
import { ShieldTick as UShieldTick } from "@untitledui/icons/ShieldTick"
import { SlashCircle01 as USlashCircle01 } from "@untitledui/icons/SlashCircle01"
import { SlashOctagon as USlashOctagon } from "@untitledui/icons/SlashOctagon"
import { Sliders01 as USliders01 } from "@untitledui/icons/Sliders01"
import { Speedometer02 as USpeedometer02 } from "@untitledui/icons/Speedometer02"
import { Square as USquare } from "@untitledui/icons/Square"
import { Star01 as UStar01 } from "@untitledui/icons/Star01"
import { Stars02 as UStars02 } from "@untitledui/icons/Stars02"
import { StopCircle as UStopCircle } from "@untitledui/icons/StopCircle"
import { StopSquare as UStopSquare } from "@untitledui/icons/StopSquare"
import { Strikethrough01 as UStrikethrough01 } from "@untitledui/icons/Strikethrough01"
import { Sun as USun } from "@untitledui/icons/Sun"
import { Sunrise as USunrise } from "@untitledui/icons/Sunrise"
import { SwitchHorizontal01 as USwitchHorizontal01 } from "@untitledui/icons/SwitchHorizontal01"
import { Table as UTable } from "@untitledui/icons/Table"
import { Tablet01 as UTablet01 } from "@untitledui/icons/Tablet01"
import { Tag01 as UTag01 } from "@untitledui/icons/Tag01"
import { Target04 as UTarget04 } from "@untitledui/icons/Target04"
import { TextInput as UTextInput } from "@untitledui/icons/TextInput"
import { Toggle01Right as UToggle01Right } from "@untitledui/icons/Toggle01Right"
import { Tool02 as UTool02 } from "@untitledui/icons/Tool02"
import { Translate01 as UTranslate01 } from "@untitledui/icons/Translate01"
import { Trash01 as UTrash01 } from "@untitledui/icons/Trash01"
import { Underline01 as UUnderline01 } from "@untitledui/icons/Underline01"
import { Upload01 as UUpload01 } from "@untitledui/icons/Upload01"
import { UploadCloud01 as UUploadCloud01 } from "@untitledui/icons/UploadCloud01"
import { User01 as UUser01 } from "@untitledui/icons/User01"
import { UserCheck01 as UUserCheck01 } from "@untitledui/icons/UserCheck01"
import { UserCircle as UUserCircle } from "@untitledui/icons/UserCircle"
import { UserPlus01 as UUserPlus01 } from "@untitledui/icons/UserPlus01"
import { UserX01 as UUserX01 } from "@untitledui/icons/UserX01"
import { Users02 as UUsers02 } from "@untitledui/icons/Users02"
import { VideoRecorder as UVideoRecorder } from "@untitledui/icons/VideoRecorder"
import { VolumeX as UVolumeX } from "@untitledui/icons/VolumeX"
import { Wallet02 as UWallet02 } from "@untitledui/icons/Wallet02"
import { WifiOff as UWifiOff } from "@untitledui/icons/WifiOff"
import { XCircle as UXCircle } from "@untitledui/icons/XCircle"

/** Untitled UI's free set is line only: kept so `weight` props still type. */
export type IconWeight = "Outline" | "Filled"

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string
  color?: string
  /** No filled set in the free icons: ignored. */
  weight?: IconWeight
  /** Ignored: the stroke is one setting (STROKE in ./custom.tsx). */
  strokeWidth?: number | string
  /** Ignored (old lucide prop). */
  absoluteStrokeWidth?: boolean
}

export type Icon = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>
/** Old names, kept so existing type imports keep working. */
export type LucideIcon = Icon
export type LucideProps = IconProps

type Source = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { size?: number; color?: string }
>

/** Decorative unless labelled; 24px unless a size-* class (the usual way)
 *  sets it; the app's stroke. */
function icon(Glyph: Source, name: string): Icon {
  const C = React.forwardRef<SVGSVGElement, IconProps>(function Icon(
    { weight: _w, strokeWidth: _s, absoluteStrokeWidth: _a, size, ...props },
    _ref,
  ) {
    const labelled = props["aria-label"] || props["aria-labelledby"]
    return (
      <Glyph
        aria-hidden={labelled ? undefined : true}
        {...props}
        {...(typeof size === "string"
          ? { width: size, height: size }
          : { size: size ?? 24 })}
        strokeWidth={STROKE}
      />
    )
  })
  C.displayName = name
  // Drawn by us (custom.tsx), not taken from Untitled UI: /icon-lab marks it.
  ;(C as { ours?: boolean }).ours = Boolean((Glyph as { ours?: boolean }).ours)
  return C
}

/** Kept for the old `Ri*Fill` names: the free set has no filled icons, so
 *  it's the same icon. */
export function filled(Source: Icon, _name: string): Icon {
  return Source
}

export const AlignCenter = /*#__PURE__*/ icon(UAlignCenter, "AlignCenter")
export const AlignLeft = /*#__PURE__*/ icon(UAlignLeft, "AlignLeft")
export const AlignRight = /*#__PURE__*/ icon(UAlignRight, "AlignRight")
export const AppWindow = /*#__PURE__*/ icon(UBrowser, "AppWindow")
export const Archive = /*#__PURE__*/ icon(UArchive, "Archive")
export const ArchiveRestore = /*#__PURE__*/ icon(UArchive, "ArchiveRestore")
export const ArrowDown = /*#__PURE__*/ icon(UArrowDown, "ArrowDown")
export const ArrowLeft = /*#__PURE__*/ icon(C.ArrowLeft, "ArrowLeft")
export const ArrowLeftRight = /*#__PURE__*/ icon(
  USwitchHorizontal01,
  "ArrowLeftRight",
)
export const ArrowRight = /*#__PURE__*/ icon(UArrowRight, "ArrowRight")
export const ArrowUp = /*#__PURE__*/ icon(UArrowUp, "ArrowUp")
export const ArrowUpRight = /*#__PURE__*/ icon(UArrowUpRight, "ArrowUpRight")
export const ArrowUpToLine = /*#__PURE__*/ icon(
  UAlignTopArrow01,
  "ArrowUpToLine",
)
export const AtSign = /*#__PURE__*/ icon(UAtSign, "AtSign")
export const BadgeCheck = /*#__PURE__*/ icon(UCheckVerified01, "BadgeCheck")
export const Ban = /*#__PURE__*/ icon(USlashCircle01, "Ban")
export const BarChart3 = /*#__PURE__*/ icon(UBarChart01, "BarChart3")
export const Bell = /*#__PURE__*/ icon(C.Bell, "Bell")
export const Bold = /*#__PURE__*/ icon(UBold01, "Bold")
export const BookOpen = /*#__PURE__*/ icon(UBookOpen01, "BookOpen")
export const Briefcase = /*#__PURE__*/ icon(UBriefcase01, "Briefcase")
export const BriefcaseBusiness = /*#__PURE__*/ icon(
  UBriefcase02,
  "BriefcaseBusiness",
)
export const Building2 = /*#__PURE__*/ icon(UBuilding02, "Building2")
export const Calculator = /*#__PURE__*/ icon(UCalculator, "Calculator")
export const CalendarCheck = /*#__PURE__*/ icon(
  UCalendarCheck01,
  "CalendarCheck",
)
export const CalendarClock = /*#__PURE__*/ icon(UCalendarDate, "CalendarClock")
export const CalendarDays = /*#__PURE__*/ icon(C.CalendarDays, "CalendarDays")
export const CalendarOff = /*#__PURE__*/ icon(UCalendarMinus01, "CalendarOff")
export const CalendarPlus = /*#__PURE__*/ icon(UCalendarPlus01, "CalendarPlus")
export const CalendarRange = /*#__PURE__*/ icon(UCalendarDate, "CalendarRange")
export const CalendarSearch = /*#__PURE__*/ icon(UCalendar, "CalendarSearch")
export const CalendarX = /*#__PURE__*/ icon(UCalendarMinus02, "CalendarX")
export const Camera = /*#__PURE__*/ icon(UCamera01, "Camera")
export const ChartColumnIncreasing = /*#__PURE__*/ icon(
  UBarChart07,
  "ChartColumnIncreasing",
)
export const ChartLine = /*#__PURE__*/ icon(ULineChartUp01, "ChartLine")
export const Check = /*#__PURE__*/ icon(C.Check, "Check")
export const CheckCheck = /*#__PURE__*/ icon(UCheckDone01, "CheckCheck")
export const CheckCircle2 = /*#__PURE__*/ icon(UCheckCircle, "CheckCircle2")
export const ChevronDown = /*#__PURE__*/ icon(C.ChevronDown, "ChevronDown")
export const ChevronDownSquare = /*#__PURE__*/ icon(
  UChevronDown,
  "ChevronDownSquare",
)
export const ChevronLeft = /*#__PURE__*/ icon(UChevronLeft, "ChevronLeft")
export const ChevronRight = /*#__PURE__*/ icon(C.ChevronRight, "ChevronRight")
export const ChevronUp = /*#__PURE__*/ icon(UChevronUp, "ChevronUp")
export const ChevronsDownUp = /*#__PURE__*/ icon(
  UChevronSelectorVertical,
  "ChevronsDownUp",
)
export const ChevronsLeft = /*#__PURE__*/ icon(
  UChevronLeftDouble,
  "ChevronsLeft",
)
export const ChevronsLeftIcon = /*#__PURE__*/ icon(
  UChevronLeftDouble,
  "ChevronsLeftIcon",
)
export const ChevronsRight = /*#__PURE__*/ icon(
  UChevronRightDouble,
  "ChevronsRight",
)
export const ChevronsRightIcon = /*#__PURE__*/ icon(
  UChevronRightDouble,
  "ChevronsRightIcon",
)
export const ChevronsUp = /*#__PURE__*/ icon(UChevronUpDouble, "ChevronsUp")
export const ChevronsUpDown = /*#__PURE__*/ icon(
  UChevronSelectorVertical,
  "ChevronsUpDown",
)
export const Chrome = /*#__PURE__*/ icon(UGoogleChrome, "Chrome")
export const Circle = /*#__PURE__*/ icon(UCircle, "Circle")
export const CircleAlert = /*#__PURE__*/ icon(UAlertCircle, "CircleAlert")
export const CircleCheck = /*#__PURE__*/ icon(UCheckCircle, "CircleCheck")
export const CircleCheckIcon = /*#__PURE__*/ icon(
  UCheckCircle,
  "CircleCheckIcon",
)
export const CircleDashed = /*#__PURE__*/ icon(UPlaceholder, "CircleDashed")
export const CircleDollarSign = /*#__PURE__*/ icon(
  UCurrencyDollarCircle,
  "CircleDollarSign",
)
export const CircleDot = /*#__PURE__*/ icon(URecording01, "CircleDot")
export const CircleHelp = /*#__PURE__*/ icon(UHelpCircle, "CircleHelp")
export const CircleX = /*#__PURE__*/ icon(UXCircle, "CircleX")
export const ClipboardCheck = /*#__PURE__*/ icon(
  UClipboardCheck,
  "ClipboardCheck",
)
export const ClipboardCopy = /*#__PURE__*/ icon(UCopy06, "ClipboardCopy")
export const ClipboardPaste = /*#__PURE__*/ icon(UClipboard, "ClipboardPaste")
export const Clock = /*#__PURE__*/ icon(C.Clock, "Clock")
export const Cloud = /*#__PURE__*/ icon(UCloud01, "Cloud")
export const CloudOff = /*#__PURE__*/ icon(UCloudOff, "CloudOff")
export const CloudUpload = /*#__PURE__*/ icon(UUploadCloud01, "CloudUpload")
export const Code = /*#__PURE__*/ icon(UCode01, "Code")
export const Code2 = /*#__PURE__*/ icon(UCode02, "Code2")
/** Drawn here (./custom.tsx): not in Untitled UI. */
export const Coffee = /*#__PURE__*/ icon(C.Coffee, "Coffee")
export const Columns2 = /*#__PURE__*/ icon(UColumns02, "Columns2")
export const Columns3 = /*#__PURE__*/ icon(UColumns03, "Columns3")
export const Copy = /*#__PURE__*/ icon(C.Copy, "Copy")
export const CopyPlus = /*#__PURE__*/ icon(UCopy04, "CopyPlus")
export const CornerDownLeft = /*#__PURE__*/ icon(
  UCornerDownLeft,
  "CornerDownLeft",
)
export const CornerDownRight = /*#__PURE__*/ icon(
  UCornerDownRight,
  "CornerDownRight",
)
export const CornerLeftUp = /*#__PURE__*/ icon(UCornerLeftUp, "CornerLeftUp")
export const CreditCard = /*#__PURE__*/ icon(UCreditCard01, "CreditCard")
export const Delete = /*#__PURE__*/ icon(UTrash01, "Delete")
export const Download = /*#__PURE__*/ icon(UDownload01, "Download")
export const EllipsisIcon = /*#__PURE__*/ icon(UDotsHorizontal, "EllipsisIcon")
export const Eraser = /*#__PURE__*/ icon(UEraser, "Eraser")
export const ExternalLink = /*#__PURE__*/ icon(ULinkExternal01, "ExternalLink")
export const Eye = /*#__PURE__*/ icon(UEye, "Eye")
export const EyeOff = /*#__PURE__*/ icon(UEyeOff, "EyeOff")
export const File = /*#__PURE__*/ icon(UFile04, "File")
export const FileIcon = /*#__PURE__*/ icon(UFile04, "FileIcon")
export const FileImage = /*#__PURE__*/ icon(UImage01, "FileImage")
export const FilePen = /*#__PURE__*/ icon(UEdit05, "FilePen")
export const FilePlus = /*#__PURE__*/ icon(UFilePlus02, "FilePlus")
export const FilePlus2 = /*#__PURE__*/ icon(UFilePlus02, "FilePlus2")
export const FileSignature = /*#__PURE__*/ icon(UFile06, "FileSignature")
export const FileText = /*#__PURE__*/ icon(C.FileText, "FileText")
export const Files = /*#__PURE__*/ icon(UCopy07, "Files")
export const Filter = /*#__PURE__*/ icon(UFilterLines, "Filter")
export const Flag = /*#__PURE__*/ icon(UFlag01, "Flag")
export const Flower = /*#__PURE__*/ icon(USun, "Flower")
export const Folder = /*#__PURE__*/ icon(C.Folder, "Folder")
export const FolderInput = /*#__PURE__*/ icon(UFolderDownload, "FolderInput")
export const FolderKanban = /*#__PURE__*/ icon(ULayoutAlt04, "FolderKanban")
export const FolderOpen = /*#__PURE__*/ icon(UFolder, "FolderOpen")
export const FolderPlus = /*#__PURE__*/ icon(UFolderPlus, "FolderPlus")
export const GalleryHorizontal = /*#__PURE__*/ icon(
  UImage04,
  "GalleryHorizontal",
)
export const Gauge = /*#__PURE__*/ icon(USpeedometer02, "Gauge")
export const Globe = /*#__PURE__*/ icon(UGlobe01, "Globe")
export const GripHorizontal = /*#__PURE__*/ icon(
  C.GripHorizontal,
  "GripHorizontal",
)
export const GripVertical = /*#__PURE__*/ icon(C.GripVertical, "GripVertical")
export const Hammer = /*#__PURE__*/ icon(UTool02, "Hammer")
export const Hash = /*#__PURE__*/ icon(UHash01, "Hash")
export const Heading = /*#__PURE__*/ icon(UHeading01, "Heading")
export const Heading1 = /*#__PURE__*/ icon(UHeading01, "Heading1")
export const Heading2 = /*#__PURE__*/ icon(UHeading02, "Heading2")
export const Heading3 = /*#__PURE__*/ icon(UHeadingSquare, "Heading3")
export const Heart = /*#__PURE__*/ icon(UHeart, "Heart")
export const Home = /*#__PURE__*/ icon(C.Home, "Home")
export const IdCard = /*#__PURE__*/ icon(UCreditCard02, "IdCard")
export const Image = /*#__PURE__*/ icon(UImage01, "Image")
export const ImageIcon = /*#__PURE__*/ icon(UImage01, "ImageIcon")
export const ImagePlus = /*#__PURE__*/ icon(UImagePlus, "ImagePlus")
export const ImageUp = /*#__PURE__*/ icon(UImageUp, "ImageUp")
export const Inbox = /*#__PURE__*/ icon(UInbox01, "Inbox")
export const Infinity = /*#__PURE__*/ icon(UInfinity, "Infinity")
export const Info = /*#__PURE__*/ icon(UInfoCircle, "Info")
export const InfoIcon = /*#__PURE__*/ icon(UInfoCircle, "InfoIcon")
export const Italic = /*#__PURE__*/ icon(UItalic01, "Italic")
export const Languages = /*#__PURE__*/ icon(UTranslate01, "Languages")
export const Layers = /*#__PURE__*/ icon(ULayersTwo01, "Layers")
export const LayoutDashboard = /*#__PURE__*/ icon(
  ULayoutAlt01,
  "LayoutDashboard",
)
export const LayoutGrid = /*#__PURE__*/ icon(ULayoutGrid01, "LayoutGrid")
export const Link = /*#__PURE__*/ icon(C.Link, "Link")
export const Link2 = /*#__PURE__*/ icon(ULink02, "Link2")
export const Link2Off = /*#__PURE__*/ icon(ULinkBroken01, "Link2Off")
export const List = /*#__PURE__*/ icon(UList, "List")
export const ListChecks = /*#__PURE__*/ icon(UCheckDone02, "ListChecks")
export const ListCollapse = /*#__PURE__*/ icon(UAlignTopArrow02, "ListCollapse")
export const ListFilter = /*#__PURE__*/ icon(UFilterLines, "ListFilter")
export const ListIcon = /*#__PURE__*/ icon(UList, "ListIcon")
export const ListOrdered = /*#__PURE__*/ icon(UDotpoints02, "ListOrdered")
export const ListPlus = /*#__PURE__*/ icon(UPlus, "ListPlus")
export const ListTodo = /*#__PURE__*/ icon(UCheckSquare, "ListTodo")
export const Loader = /*#__PURE__*/ icon(ULoading01, "Loader")
export const Loader2Icon = /*#__PURE__*/ icon(ULoading02, "Loader2Icon")
export const LoaderCircle = /*#__PURE__*/ icon(ULoading02, "LoaderCircle")
export const Lock = /*#__PURE__*/ icon(ULock01, "Lock")
export const LogIn = /*#__PURE__*/ icon(ULogIn01, "LogIn")
export const LogOut = /*#__PURE__*/ icon(ULogOut01, "LogOut")
export const Logout = /*#__PURE__*/ icon(ULogOut01, "Logout")
export const Mail = /*#__PURE__*/ icon(UMail01, "Mail")
export const MailOpen = /*#__PURE__*/ icon(UMail03, "MailOpen")
export const MapPin = /*#__PURE__*/ icon(UMarkerPin01, "MapPin")
export const Maximize = /*#__PURE__*/ icon(UMaximize01, "Maximize")
export const Maximize2 = /*#__PURE__*/ icon(UExpand06, "Maximize2")
export const Megaphone = /*#__PURE__*/ icon(UAnnouncement01, "Megaphone")
export const Menu = /*#__PURE__*/ icon(UMenu01, "Menu")
export const MessageCircle = /*#__PURE__*/ icon(
  UMessageCircle01,
  "MessageCircle",
)
export const MessageSquareWarning = /*#__PURE__*/ icon(
  UMessageAlertSquare,
  "MessageSquareWarning",
)
export const Minimize2 = /*#__PURE__*/ icon(UMinimize02, "Minimize2")
export const Minus = /*#__PURE__*/ icon(UMinus, "Minus")
export const MinusIcon = /*#__PURE__*/ icon(UMinus, "MinusIcon")
export const Monitor = /*#__PURE__*/ icon(UMonitor01, "Monitor")
export const Moon = /*#__PURE__*/ icon(UMoon01, "Moon")
export const MoreHorizontal = /*#__PURE__*/ icon(
  C.MoreHorizontal,
  "MoreHorizontal",
)
export const MoreHorizontalIcon = /*#__PURE__*/ icon(
  UDotsHorizontal,
  "MoreHorizontalIcon",
)
export const MoreVertical = /*#__PURE__*/ icon(UDotsVertical, "MoreVertical")
export const MousePointerClick = /*#__PURE__*/ icon(
  UCursorClick01,
  "MousePointerClick",
)
export const Newspaper = /*#__PURE__*/ icon(UFile06, "Newspaper")
export const NotebookPen = /*#__PURE__*/ icon(UEdit04, "NotebookPen")
export const OctagonAlert = /*#__PURE__*/ icon(UAlertOctagon, "OctagonAlert")
export const OctagonXIcon = /*#__PURE__*/ icon(USlashOctagon, "OctagonXIcon")
export const Palette = /*#__PURE__*/ icon(UPalette, "Palette")
export const PanelLeftIcon = /*#__PURE__*/ icon(ULayoutLeft, "PanelLeftIcon")
export const Paperclip = /*#__PURE__*/ icon(UPaperclip, "Paperclip")
export const Pause = /*#__PURE__*/ icon(UPauseCircle, "Pause")
export const Pencil = /*#__PURE__*/ icon(C.Pencil, "Pencil")
export const PencilRuler = /*#__PURE__*/ icon(UPenTool02, "PencilRuler")
export const Phone = /*#__PURE__*/ icon(UPhone, "Phone")
export const PieChart = /*#__PURE__*/ icon(UPieChart01, "PieChart")
export const Pilcrow = /*#__PURE__*/ icon(UPilcrow01, "Pilcrow")
export const Pin = /*#__PURE__*/ icon(UPin01, "Pin")
export const Play = /*#__PURE__*/ icon(UPlay, "Play")
export const Plus = /*#__PURE__*/ icon(C.Plus, "Plus")
export const Power = /*#__PURE__*/ icon(UPower01, "Power")
export const Printer = /*#__PURE__*/ icon(UPrinter, "Printer")
export const Quote = /*#__PURE__*/ icon(UMessageTextSquare01, "Quote")
export const Radio = /*#__PURE__*/ icon(UPodcast, "Radio")
export const Redo2 = /*#__PURE__*/ icon(UFlipForward, "Redo2")
export const RefreshCW = /*#__PURE__*/ icon(URefreshCw01, "RefreshCW")
export const Repeat2 = /*#__PURE__*/ icon(URepeat01, "Repeat2")
export const Rocket = /*#__PURE__*/ icon(URocket01, "Rocket")
export const RotateCcw = /*#__PURE__*/ icon(URefreshCcw01, "RotateCcw")
export const RotateCw = /*#__PURE__*/ icon(URefreshCw01, "RotateCw")
export const Rows2 = /*#__PURE__*/ icon(URows02, "Rows2")
export const Ruler = /*#__PURE__*/ icon(URuler, "Ruler")
export const Save = /*#__PURE__*/ icon(USave01, "Save")
export const Scissors = /*#__PURE__*/ icon(UScissors01, "Scissors")
export const ScrollText = /*#__PURE__*/ icon(UFile05, "ScrollText")
export const Search = /*#__PURE__*/ icon(C.Search, "Search")
export const SearchCheck = /*#__PURE__*/ icon(USearchRefraction, "SearchCheck")
export const Send = /*#__PURE__*/ icon(USend01, "Send")
export const SeparatorHorizontal = /*#__PURE__*/ icon(
  UDivider,
  "SeparatorHorizontal",
)
export const Settings = /*#__PURE__*/ icon(C.Settings, "Settings")
export const Settings2 = /*#__PURE__*/ icon(USettings02, "Settings2")
export const ShieldCheck = /*#__PURE__*/ icon(UShieldTick, "ShieldCheck")
export const SlidersHorizontal = /*#__PURE__*/ icon(
  USliders01,
  "SlidersHorizontal",
)
export const Smartphone = /*#__PURE__*/ icon(UPhone01, "Smartphone")
export const Smile = /*#__PURE__*/ icon(UFaceSmile, "Smile")
export const Sparkles = /*#__PURE__*/ icon(UStars02, "Sparkles")
export const Split = /*#__PURE__*/ icon(UGitBranch01, "Split")
export const Square = /*#__PURE__*/ icon(USquare, "Square")
export const SquarePen = /*#__PURE__*/ icon(UEdit05, "SquarePen")
export const SquareStop = /*#__PURE__*/ icon(UStopSquare, "SquareStop")
export const Star = /*#__PURE__*/ icon(UStar01, "Star")
export const StickyNote = /*#__PURE__*/ icon(UFile03, "StickyNote")
export const StopCircle = /*#__PURE__*/ icon(UStopCircle, "StopCircle")
export const Strikethrough = /*#__PURE__*/ icon(
  UStrikethrough01,
  "Strikethrough",
)
export const Sun = /*#__PURE__*/ icon(USun, "Sun")
export const Sunrise = /*#__PURE__*/ icon(USunrise, "Sunrise")
export const Table = /*#__PURE__*/ icon(UTable, "Table")
export const Table2 = /*#__PURE__*/ icon(UTable, "Table2")
export const Tablet = /*#__PURE__*/ icon(UTablet01, "Tablet")
export const Tag = /*#__PURE__*/ icon(UTag01, "Tag")
export const Target = /*#__PURE__*/ icon(UTarget04, "Target")
export const TextCursorInput = /*#__PURE__*/ icon(UTextInput, "TextCursorInput")
export const TextQuote = /*#__PURE__*/ icon(UMessageTextSquare02, "TextQuote")
export const TimerReset = /*#__PURE__*/ icon(UClockRefresh, "TimerReset")
export const ToggleRight = /*#__PURE__*/ icon(UToggle01Right, "ToggleRight")
export const Trash2 = /*#__PURE__*/ icon(C.Trash2, "Trash2")
export const TriangleAlert = /*#__PURE__*/ icon(UAlertTriangle, "TriangleAlert")
export const TriangleAlertIcon = /*#__PURE__*/ icon(
  UAlertTriangle,
  "TriangleAlertIcon",
)
export const Underline = /*#__PURE__*/ icon(UUnderline01, "Underline")
export const Undo2 = /*#__PURE__*/ icon(UFlipBackward, "Undo2")
export const Upload = /*#__PURE__*/ icon(UUpload01, "Upload")
export const User = /*#__PURE__*/ icon(UUser01, "User")
export const UserCheck = /*#__PURE__*/ icon(UUserCheck01, "UserCheck")
export const UserPlus = /*#__PURE__*/ icon(UUserPlus01, "UserPlus")
export const UserRound = /*#__PURE__*/ icon(UUserCircle, "UserRound")
export const UserRoundX = /*#__PURE__*/ icon(UUserX01, "UserRoundX")
export const Users = /*#__PURE__*/ icon(C.Users, "Users")
export const UsersRound = /*#__PURE__*/ icon(UUsers02, "UsersRound")
export const Video = /*#__PURE__*/ icon(UVideoRecorder, "Video")
export const VolumeX = /*#__PURE__*/ icon(UVolumeX, "VolumeX")
export const Wallet = /*#__PURE__*/ icon(UWallet02, "Wallet")
export const WandSparkles = /*#__PURE__*/ icon(UMagicWand02, "WandSparkles")
export const WifiOff = /*#__PURE__*/ icon(UWifiOff, "WifiOff")
export const Workflow = /*#__PURE__*/ icon(UDataflow03, "Workflow")
export const X = /*#__PURE__*/ icon(C.X, "X")
export const XCircle = /*#__PURE__*/ icon(UXCircle, "XCircle")
