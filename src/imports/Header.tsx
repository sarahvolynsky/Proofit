import svgPaths from "./svg-48jydxjgjy";
import clsx from "clsx";
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div className={clsx("h-[20px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">{children}</div>
    </div>
  );
}

export default function Header() {
  return (
    <div className="bg-[#F6F6F6] relative size-full flex items-center" data-name="Header">
      <div aria-hidden="true" className="absolute border-[#e2e8f0] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between pb-px pt-0 px-[32px] relative size-full">
          <div className="h-[18px] relative shrink-0 w-[100.453px]" data-name="Container">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
              <Wrapper additionalClassNames="w-[37.328px] h-[18px]">
                <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-0 not-italic text-[#62748e] text-[16px] text-nowrap top-0 tracking-[-0.5004px]">Proofit</p>
              </Wrapper>
            </div>
          </div>
          <div className="h-[14px] relative shrink-0 w-[55px]" data-name="Container">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
              <div className="basis-0 grow h-[14px] min-h-px min-w-px relative shrink-0" data-name="Button">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[14px] left-[44px] not-italic text-[#62748e] text-[11px] text-center text-nowrap top-px translate-x-[-50%]">Share</p>
                  <div className="absolute left-[-0.45px] size-[24px] top-[-5px]" data-name="humbleicons:share">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27 27">
                      <g id="humbleicons:share">
                        <path d={svgPaths.p30dabdf8} id="Vector" stroke="var(--stroke-0, #62748E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}